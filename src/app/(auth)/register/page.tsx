import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* 卡片容器 */}
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
          {/* Logo 和标题 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 mb-4">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground">创建账户</h1>
            <p className="text-muted-foreground mt-2">注册开始您的声音克隆之旅</p>
          </div>

          {/* 注册表单 */}
          <RegisterForm />

          {/* 底部登录链接 */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            已有账户？{" "}
            <Link
              href="/login"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              立即登录
            </Link>
          </div>
        </div>

        {/* 底部提示 */}
        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          注册即表示您同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  );
}
