import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";
import { initiatePayment, MomoNetwork } from "@/lib/moolre";
import { CREDIT_PACKS, CreditPackKey } from "@/lib/plans";

/**
 * POST /api/ussd/moolre
 *
 * Moolre USSD callback (docs.moolre.com → USSD Applications). When a user
 * dials the Niena USSD code, Moolre POSTs here for every screen:
 *   { sessionid, msisdn, message, new }
 * and expects
 *   { message: string, reply: boolean }   // reply=false ends the session
 *
 * Sessions are stateless HTTP, so the user's position in the menu is kept in
 * the UssdSession table keyed by Moolre's sessionid (Vercel functions have no
 * shared memory). Callers are matched to Niena accounts through the phone
 * number recorded on their previous mobile-money payments (metadata.payer).
 *
 * Menu:
 *   1. My Balance      — resume credits / interview minutes / plan
 *   2. Buy Credits     — pick a pack, confirm, momo prompt is sent to caller
 *   3. Pricing         — plan overview
 *   4. Help
 */

const MENU_TEXT =
  "Welcome to Niena\n1. My Balance\n2. Buy Resume Credits\n3. Pricing\n4. Help";

const PACKS: { key: CreditPackKey; label: string }[] = [
  { key: "CREDITS_10", label: "10 credits - GHS 25" },
  { key: "CREDITS_20", label: "20 credits - GHS 45" },
  { key: "CREDITS_30", label: "30 credits - GHS 65" },
  { key: "CREDITS_50", label: "50 credits - GHS 100" },
];

const PACK_MENU = `Buy Resume Credits\n${PACKS.map(
  (p, i) => `${i + 1}. ${p.label}`
).join("\n")}\n0. Back`;

const PRICING_TEXT =
  "Niena Plans (30 days)\nSilver GHS450\nGold GHS750\nDiamond GHS1500\nTop-ups from GHS25.\nVisit nienalabs.com/pricing";

const HELP_TEXT =
  "Niena - AI career tools.\nBuild resumes & ace interviews.\nVisit nienalabs.com or email hello@nienalabs.com";

/** Local (0-prefixed) form of an MSISDN Moolre reports as 233XXXXXXXXX. */
function toLocal(msisdn: string): string {
  const digits = msisdn.replace(/\D/g, "");
  if (digits.startsWith("233")) return `0${digits.slice(3)}`;
  if (digits.startsWith("0")) return digits;
  return `0${digits}`;
}

/** International (233…) form, kept for matching older transaction records. */
function toIntl(msisdn: string): string {
  const digits = msisdn.replace(/\D/g, "");
  if (digits.startsWith("233")) return digits;
  if (digits.startsWith("0")) return `233${digits.slice(1)}`;
  return `233${digits}`;
}

/** Guesses the momo network from a Ghanaian number prefix (same map as the web dialog). */
function detectNetwork(msisdn: string): MomoNetwork | null {
  const prefix = toLocal(msisdn).slice(0, 3);
  if (["024", "025", "053", "054", "055", "059"].includes(prefix)) return "MTN";
  if (["020", "050"].includes(prefix)) return "TELECEL";
  if (["026", "027", "056", "057"].includes(prefix)) return "AT";
  return null;
}

/** Finds the Niena user whose momo payments used this phone number. */
async function findUserByPhone(msisdn: string): Promise<string | null> {
  const tx = await prisma.transaction.findFirst({
    where: {
      OR: [
        { metadata: { path: ["payer"], equals: toLocal(msisdn) } },
        { metadata: { path: ["payer"], equals: toIntl(msisdn) } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: { userId: true },
  });
  return tx?.userId ?? null;
}

function ussd(message: string, reply: boolean) {
  return NextResponse.json({ message, reply });
}

interface SessionData {
  packKey?: CreditPackKey;
  network?: MomoNetwork;
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const sessionid: string | undefined = body?.sessionid;
  const msisdn: string | undefined = body?.msisdn;
  const input: string = String(body?.message ?? "").trim();
  const isNew: boolean = Boolean(body?.new);

  if (!sessionid || !msisdn) {
    return NextResponse.json({ message: "Missing session" }, { status: 400 });
  }

  try {
    if (isNew) {
      // Opportunistic cleanup of abandoned sessions, then start at the menu
      await prisma.ussdSession.deleteMany({
        where: { updatedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) } },
      });
      await prisma.ussdSession.upsert({
        where: { id: sessionid },
        create: { id: sessionid, msisdn, stage: "MENU" },
        update: { stage: "MENU", data: {} },
      });
      return ussd(MENU_TEXT, true);
    }

    const session = await prisma.ussdSession.findUnique({ where: { id: sessionid } });
    if (!session) return ussd("Session expired. Please dial again.", false);

    const data = (session.data ?? {}) as SessionData;

    const setStage = (stage: string, newData: SessionData = data) =>
      prisma.ussdSession.update({
        where: { id: sessionid },
        data: { stage, data: newData as object },
      });
    const endSession = () =>
      prisma.ussdSession.delete({ where: { id: sessionid } }).catch(() => {});

    switch (session.stage) {
      case "MENU": {
        if (input === "1") {
          const userId = await findUserByPhone(msisdn);
          await endSession();
          if (!userId) {
            return ussd(
              "No Niena account is linked to this number yet. Make a purchase on nienalabs.com with this momo number to link it.",
              false
            );
          }
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { resume_credits: true, interview_minutes: true, plan: true },
          });
          return ussd(
            `Niena Balance\nPlan: ${user?.plan}\nResume credits: ${user?.resume_credits}\nInterview minutes: ${user?.interview_minutes}`,
            false
          );
        }
        if (input === "2") {
          await setStage("BUY_PACK");
          return ussd(PACK_MENU, true);
        }
        if (input === "3") {
          await endSession();
          return ussd(PRICING_TEXT, false);
        }
        if (input === "4") {
          await endSession();
          return ussd(HELP_TEXT, false);
        }
        return ussd(`Invalid choice.\n${MENU_TEXT}`, true);
      }

      case "BUY_PACK": {
        if (input === "0") {
          await setStage("MENU", {});
          return ussd(MENU_TEXT, true);
        }
        const pack = PACKS[Number(input) - 1];
        if (!pack) return ussd(`Invalid choice.\n${PACK_MENU}`, true);

        const network = data.network ?? detectNetwork(msisdn);
        if (!network) {
          await setStage("PICK_NETWORK", { packKey: pack.key });
          return ussd("Select your network\n1. MTN\n2. Telecel\n3. AT", true);
        }
        await setStage("CONFIRM", { packKey: pack.key, network });
        return ussd(`Pay GHS ${CREDIT_PACKS[pack.key].priceGHS} for ${pack.label}?\n1. Confirm\n2. Cancel`, true);
      }

      case "PICK_NETWORK": {
        const network = ({ "1": "MTN", "2": "TELECEL", "3": "AT" } as const)[input];
        if (!network || !data.packKey) {
          return ussd("Select your network\n1. MTN\n2. Telecel\n3. AT", true);
        }
        await setStage("CONFIRM", { ...data, network });
        const pack = CREDIT_PACKS[data.packKey];
        return ussd(`Pay GHS ${pack.priceGHS} for ${pack.credits} credits?\n1. Confirm\n2. Cancel`, true);
      }

      case "CONFIRM": {
        if (input !== "1" || !data.packKey || !data.network) {
          await endSession();
          return ussd("Cancelled. Thank you for using Niena.", false);
        }

        const userId = await findUserByPhone(msisdn);
        await endSession();
        if (!userId) {
          return ussd(
            "No Niena account is linked to this number yet. Make a purchase on nienalabs.com with this momo number to link it.",
            false
          );
        }

        const pack = CREDIT_PACKS[data.packKey];
        const payer = toLocal(msisdn);
        const reference = `niena_${randomUUID()}`;
        await prisma.transaction.create({
          data: {
            reference,
            userId,
            amount: Math.round(pack.priceGHS * 100),
            currency: "GHS",
            type: "CREDIT_PURCHASE",
            status: "PENDING",
            credits: pack.credits,
            provider: "MOOLRE",
            metadata: { userId, type: "CREDIT_PURCHASE", credits: pack.credits, flow: "ussd", payer },
          },
        });

        const result = await initiatePayment({
          payer,
          network: data.network,
          amount: pack.priceGHS,
          externalref: reference,
          reference: `Niena ${pack.credits} Resume Credits`,
        });

        if (result.kind !== "sent") {
          return ussd("Sorry, we couldn't start the payment. Please try again later.", false);
        }
        return ussd(
          "Payment prompt sent. Approve it with your momo PIN and your credits will be added automatically.",
          false
        );
      }

      default: {
        await endSession();
        return ussd("Session error. Please dial again.", false);
      }
    }
  } catch (err: any) {
    console.error(`[Moolre USSD] Error in session ${sessionid}:`, err?.message);
    return ussd("Sorry, something went wrong. Please try again.", false);
  }
}
