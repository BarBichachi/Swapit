// hooks/useAuthGuard.ts
import { useAuth } from "@/hooks/useAuth";
import { usePathname, useRouter } from "expo-router";

type GuardOptions = {
  onFail?: () => void;
  redirectParams?: Record<string, string | number | boolean | undefined>;
};

export default function useAuthGuard() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAuthed = !!user;

  const requireAuth = (fn: () => void, opts?: GuardOptions) => {
    if (isAuthed) {
      fn();
      return true;
    }
    opts?.onFail?.();
    router.push({
      pathname: "/(auth)/login",
      params: {
        redirect: pathname ?? "/",
        source: "guard",
        ...opts?.redirectParams,
      },
    } as never);
    return false;
  };

  return { isAuthed, requireAuth };
}
