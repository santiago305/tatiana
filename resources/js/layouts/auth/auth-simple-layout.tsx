import { Link } from "@inertiajs/react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

import AppLogoIcon from "@/components/app-logo-icon";
import type { AuthLayoutProps } from "@/types";
import { home } from "@/routes";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function AuthSimpleLayout({
  children,
  title,
  description,
}: AuthLayoutProps) {
  return (
    <div className="relative min-h-svh overflow-hidden bg-white">
      {/* blobs decorativos sutiles */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-40 h-96 w-96 rounded-full bg-orange-500/15 blur-3xl"
        animate={{ x: [0, 14, 0], y: [0, 10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-orange-500/10 blur-3xl"
        animate={{ x: [0, -10, 0], y: [0, -8, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto grid min-h-svh w-full max-w-6xl grid-cols-1 items-stretch gap-8 px-4 py-10 md:grid-cols-2 md:gap-10 md:px-8">
        {/* Panel izquierdo: branding */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="flex flex-col justify-center"
        >
          <Link href={home()} className="inline-flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-500 text-white shadow-sm">
              <Lock className="h-5 w-5" />
            </div>

            <div className="leading-tight">
              <p className="text-sm font-medium text-black/60">Sistema</p>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-black">
                  {title}
                </h1>
              </div>
            </div>
          </Link>

          <p className="mt-6 max-w-md text-balance text-sm leading-6 text-black/70">
            {description}
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            <span className="rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-xs font-medium text-black">
              Control total en tiempo real           
            </span>
            <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/80">
              Pagos y clientes centralizados
            </span>
            <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/80">
              Automatiza y simplifica tu gestión
            </span>
          </div>
        </motion.section>

        {/* Panel derecho: aquí entra el formulario */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex items-center justify-center"
        >
          <div className="w-full max-w-md">{children}</div>
        </motion.section>
      </div>
    </div>
  );
}
