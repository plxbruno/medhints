/**
 * Landing page with login screen
 */
"use client"; //this component must be rendered on the client since it uses useState (interactive)

import { useEffect, useState } from "react";
import { createClient } from "./utils/supabase/client";
import { useRouter } from "next/navigation";
import { translate } from "./utils/translateSupabaseErrors";

import Alert from "./alert/alert";
import { useAlert } from "./alert/useAlert";

export default function Home() {
  const [isLogIn, setIsLogIn] = useState<boolean>(true);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { showAlert, message, type, triggerAlert } = useAlert();
  const router = useRouter();
  const supabase = createClient();

  const onPageLoad = async () => {
    //check if user is already logged in
    const { data, error } = await supabase.auth.getUser();

    if (!error && data?.user) {
      await supabase.from("ActivityLog").insert({action: 'Entrou na app'}); //for usage analytics
      router.push("/dashboard");
    }
  }

  useEffect(() => {onPageLoad()}, []);

  const login = async () => {
    //check if user entered both an email and a password
    if (!email || !password){
      triggerAlert("Por favor escreva um email e uma senha", "error");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    //show alert if there is a log in error
    if (error) {
      setIsLoading(false);
      triggerAlert(translate(error.message), "error");
      return;
    }

    setIsLoading(false);
    await supabase.from("ActivityLog").insert({action: 'Fez log in'}); //for usage analytics
    router.push("/dashboard"); //navigate to dashboard
  };

  const signUp = async () => {
    //check if user entered both an email and a password
    if (!email || !password){
      triggerAlert("Email ou password em falta", "error");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    //show alert if there is an error signing up
    if (error) {
      setIsLoading(false);
      triggerAlert(translate(error.message), "error");
      return;
    }

    await supabase.from("ActivityLog").insert({action: 'Criou conta'}); //for usage analytics
    triggerAlert("Conta criada, pode fazer login", "success");
    setIsLoading(false);
    setIsLogIn(true); //change to log-in section
  };

  return (
    <>
      {/* Alert section */}
      {showAlert && <Alert message={message} type={type} />}

      <main className="hero min-h-screen bg-base-200 fixed" data-theme="light">
        <div className="hero-content flex-col lg:flex-row-reverse">
          <div className="text-center lg:text-left">
            <h1 className="text-5xl font-bold"><span style={{color: 'rgb(151,7,0)'}}>Med</span>Hints</h1>
            <p className="py-6">
            Contato: bruno@medhints.com.br
            </p>
          </div>

          <div className="card shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
            <div className="card-body">
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Email"
                    className="input input-bordered"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-control pt-3">
                  <label className="label">
                    <span className="label-text">Senha</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Senha"
                    className="input input-bordered"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="form-control mt-6">
                  <button
                    className="btn btn-primary"
                    onClick={() => (isLogIn ? login() : signUp())}
                  >
                    {isLogIn ? "Entrar" : "Registrar"}
                  </button>
                </div>
              </form>

              {/* Google auth section */}
              <button
                className="btn btn-outline btn-primary flex items-center"
                onClick={() => {
                  supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: {
                      redirectTo: `${window.location.origin}/dashboard`, 
                    },
                  });
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  width="24px"
                  height="24px"
                  className="mr-2"
                >
                  <path
                    fill="#FFC107"
                    d="M43.6 20H24v8h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6-6C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c12 0 22-9.8 22-22 0-1.3-.2-2.7-.4-4z"
                  />

                  <path
                    fill="#FF3D00"
                    d="M6.3 14.7l6.9 5.1C14.9 17.1 19.2 14 24 14c3.1 0 5.9 1.1 8.1 2.9l6-6C34.6 4.1 29.6 2 24 2 16.3 2 9.6 6.6 6.3 14.7z"
                  />

                  <path
                    fill="#4CAF50"
                    d="M24 44c4.5 0 8.7-1.5 12-4l-6-6c-2.2 1.8-5 2.9-8.1 2.9-5.9 0-10.9-3.1-13.4-7.7l-6.9 5.1C9.6 41.4 16.3 46 24 46z"
                  />

                  <path
                    fill="#1976D2"
                    d="M43.6 20H24v8h11.8c-.7 2.3-2.1 4.3-3.8 5.9l6 6c3.3-2.5 5.8-6.2 7-10.4.2-1.3.4-2.6.4-4 0-1.3-.2-2.7-.4-4z"
                  />
                </svg>
                Continue com o Google
              </button>

              {/* Show loading indicator */}
              {isLoading && (
                <div className="text-center">
                  <span className="loading loading-ring loading-lg text-center"></span>
                </div>
                
              )}

              {/* Toggle between sign up and log in sections */}
              <a
                className="link link-primary p-5 text-center"
                onClick={() => setIsLogIn(!isLogIn)}
              >
                {isLogIn ? "Não tem conta?" : "Já tem conta?"}
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
