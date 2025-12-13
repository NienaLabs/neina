import {
  defaultShouldDehydrateQuery,
  QueryClient,
  MutationCache,
  QueryCache,
} from '@tanstack/react-query';
import superjson from 'superjson';
import { toast } from 'sonner';

export function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (err) => {
        if (err.message.includes('SUBSCRIPTION_EXPIRED')) {
          toast.error("Your subscription has expired", {
            description: "Please renew your plan to continue using premium features.",
            action: {
              label: "Renew",
              onClick: () => window.location.href = "/pricing",
            },
            duration: 8000,
          });
        }
      },
    }),
    mutationCache: new MutationCache({
       onError: (err) => {
        if (err.message.includes('SUBSCRIPTION_EXPIRED')) {
          toast.error("Your subscription has expired", {
            description: "Please renew your plan to continue using premium features.",
            action: {
              label: "Renew",
              onClick: () => window.location.href = "/pricing",
            },
            duration: 8000,
          });
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
      dehydrate: {
         serializeData: superjson.serialize,
         shouldDehydrateQuery: (query) =>
           defaultShouldDehydrateQuery(query) ||
           query.state.status === 'pending',
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  });
}