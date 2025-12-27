import { useEffect } from "react";
import { useMiniApp } from "@neynar/react";
import { useAccount } from "wagmi";

export function useUserSync() {
  const { context } = useMiniApp();
  const { address, isConnected } = useAccount();

  useEffect(() => {
    if (context?.user) {
      const syncUser = async () => {
        try {
          const payload: any = { user: { ...context.user } };
          
          // If wallet is connected, verify this address
          if (isConnected && address) {
            payload.user.verifications = [address];
          }

          await fetch("/api/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          // console.log("User synced:", context.user.fid, isConnected ? width Address : "");
        } catch (error) {
          console.error("Failed to sync user:", error);
        }
      };

      syncUser();
    }
  }, [context?.user, address, isConnected]);
}
