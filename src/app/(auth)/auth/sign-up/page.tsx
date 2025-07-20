import type { Metadata } from "next";
import SignupWithPassword from "@/components/Auth/SignupWithPassword";
import AuthRightPanel from "@/components/Auth/AuthRightPanel";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-2">
      <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="flex flex-wrap items-center">
          <div className="w-full xl:w-1/2">
            <div className="w-full p-4 sm:p-12.5 xl:p-15">
              <SignupWithPassword />
            </div>
          </div>

          <div className="hidden w-full p-7.5 xl:block xl:w-1/2">
            <AuthRightPanel
              title="Create an account"
              description="Please fill in the form below to get started"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
