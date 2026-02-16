import { Form, Head } from "@inertiajs/react";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";

import InputError from "@/components/input-error";
import TextLink from "@/components/text-link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import AuthLayout from "@/layouts/auth-layout";
import { store } from "@/routes/login";
import { request } from "@/routes/password";

type Props = {
  status?: string;
  canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
  return (
    <AuthLayout title="GESEM" description="Ingresa tu correo y contraseña para continuar">
      <Head title="Log in" />

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.35)] md:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-black">Iniciar sesión</h2>
          <p className="mt-1 text-sm text-black/60">
            Accede con tus credenciales.
          </p>
        </div>

        {status && (
          <div className="mb-4 rounded-2xl border border-green-600/20 bg-green-600/10 px-4 py-3 text-sm font-medium text-green-700">
            {status}
          </div>
        )}

        <Form {...store.form()} resetOnSuccess={["password"]} className="flex flex-col gap-5">
          {({ processing, errors }) => (
            <>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-black">
                  Correo
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    required
                    autoFocus
                    tabIndex={1}
                    autoComplete="email"
                    placeholder="email@example.com"
                    className="pl-10"
                  />
                </div>
                <InputError message={errors.email} />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password" className="text-black">
                    Contraseña
                  </Label>
                  {canResetPassword && (
                    <TextLink
                      href={request()}
                      className="ml-auto text-sm text-black/70 hover:text-black"
                      tabIndex={5}
                    >
                      ¿Olvidaste tu contraseña?
                    </TextLink>
                  )}
                </div>

                <Input
                  id="password"
                  type="password"
                  name="password"
                  required
                  tabIndex={2}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
                <InputError message={errors.password} />
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox id="remember" name="remember" tabIndex={3} />
                <Label htmlFor="remember" className="text-black/80">
                  Recordarme
                </Label>
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  type="submit"
                  tabIndex={4}
                  disabled={processing}
                  data-test="login-button"
                  className="mt-2 w-full rounded-2xl bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-70"
                >
                  {processing && <Spinner />}
                  Entrar
                </Button>
              </motion.div>

              <p className="text-center text-xs text-black/50">
                © {new Date().getFullYear()} GESEM
              </p>
            </>
          )}
        </Form>
      </div>
    </AuthLayout>
  );
}
