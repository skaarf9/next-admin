"use client";
import React, { useState, useEffect } from "react";
import InputGroup from "../FormElements/InputGroup";
import { EmailIcon, PasswordIcon, EyeIcon, EyeOffIcon } from "@/assets/icons";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CryptoJS from "crypto-js";

export default function SignupWithPassword() {
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 实时检测密码是否一致
  useEffect(() => {
    setPasswordMatch(data.password === data.confirmPassword);
  }, [data.password, data.confirmPassword]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!passwordMatch) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    const secret = process.env.NEXT_PUBLIC_DATA_ENCRYPT_SECRET || "default_secret";
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
      }),
      secret
    ).toString();

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: encrypted }),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/auth/sign-in");
    } else {
      const result = await res.json();
      alert(result.error || "Registration failed");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <InputGroup
        type="text"
        label="Name"
        className="mb-4"
        placeholder="Enter your name"
        name="name"
        handleChange={handleChange}
        value={data.name}
        icon={null}
      />

      <InputGroup
        type="email"
        label="Email"
        className="mb-4"
        placeholder="Enter your email"
        name="email"
        handleChange={handleChange}
        value={data.email}
        icon={<EmailIcon />}
      />

      <InputGroup
        type={showPassword ? "text" : "password"}
        label="Password"
        className="mb-4"
        placeholder="Enter your password"
        name="password"
        handleChange={handleChange}
        value={data.password}
        icon={
          <span
            style={{ cursor: "pointer" }}
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={0}
            aria-label={showPassword ? "隐藏密码" : "显示密码"}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </span>
        }
      />

      <InputGroup
        type={showPassword ? "text" : "password"}
        label="Confirm Password"
        className="mb-2"
        placeholder="Confirm your password"
        name="confirmPassword"
        handleChange={handleChange}
        value={data.confirmPassword}
        icon={null}
      />

      {!passwordMatch && (
        <p className="mb-4 text-sm text-red-500">Passwords do not match</p>
      )}

      <button
        type="submit"
        className="w-full bg-primary text-white p-4 rounded-lg font-medium hover:bg-opacity-90 transition"
        disabled={loading}
      >
        {loading ? "Signing Up..." : "Sign Up"}
      </button>

      <div className="mt-6 text-center">
        <p>
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-primary">
            Sign In
          </Link>
        </p>
      </div>
    </form>
  );
}
