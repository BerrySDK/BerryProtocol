import { BookOpen, Github, LifeBuoy, Package2, ShieldCheck } from "lucide-react";

export function baseOptions() {
  return {
    nav: {
      title: (
        <div className="flex items-center gap-2 font-semibold">
          <span className="inline-flex size-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
            <BookOpen className="size-4" />
          </span>
          <span>BerrySDK</span>
        </div>
      ),
    },
    links: [
      {
        text: "BerryProtocol",
        url: "/docs/berryprotocol",
        icon: <Package2 className="size-4" />,
      },
      {
        text: "BerryOTP",
        url: "/docs/berryotp",
        icon: <ShieldCheck className="size-4" />,
      },
      {
        text: "Support",
        url: "https://github.com/BerrySDK/BerryProtocol/issues",
        icon: <LifeBuoy className="size-4" />,
      },
    ],
    githubUrl: "https://github.com/BerrySDK/BerryProtocol",
    themeSwitch: {
      enabled: true,
    },
    searchToggle: {
      enabled: true,
    },
    sidebar: {
      defaultOpenLevel: 1,
      banner: (
        <div className="berry-card rounded-2xl p-3 text-sm text-white/80">
          BerrySDK docs for WhatsApp workflows, native-flow, AI label, and OTP.
        </div>
      ),
    },
    footer: (
      <div className="flex items-center gap-2 text-sm text-white/60">
        <Github className="size-4" />
        Built by BerrySDK
      </div>
    ),
  };
}
