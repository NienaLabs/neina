declare module 'duix-guiji-light' {
    export default class Duix {
        constructor();
        init(config: {
            sign: string;
            containerLable: string;
            conversationId: string;
            platform: string;
        }): void;
        start(options?: {
            openAsr?: boolean;
            muted?: boolean;
            enableLLM?: number; // 0 for off, 1 for on
            wipeGreen?: boolean;
            userId?: number;
            vadSilenceTime?: number;
            useActSection?: boolean;
        }): Promise<any>;
        stop(): void;
        on(event: string, callback: (data?: any) => void): void;
        openAsr(): Promise<any>;
        closeAsr(): Promise<any>;
        resume(): void;
        setVideoMuted(flag: boolean): void;
        speak(option: { content: string; audio?: string; interrupt?: boolean }): Promise<any>;
    }
}
