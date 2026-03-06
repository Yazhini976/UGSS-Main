import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Login = () => {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = () => {
        // 🔐 TEMP credentials (change later / connect backend)
        const VALID_USERNAME = "admin";
        const VALID_PASSWORD = "admin123";

        if (username === VALID_USERNAME && password === VALID_PASSWORD) {
            // save login
            localStorage.setItem("user", username);

            // go to dashboard - use window.location to force full reload and trigger App logic
            window.location.href = "/";
        } else {
            setError("Invalid username or password");
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-100">
            <div className="w-96 rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-center text-2xl font-bold">
                    Admin Login
                </h2>

                <Input
                    placeholder="Username"
                    className="mb-3"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <Input
                    type="password"
                    placeholder="Password"
                    className="mb-3"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {error && (
                    <p className="mb-3 text-sm text-red-600">{error}</p>
                )}

                <Button className="w-full" onClick={handleLogin}>
                    Login
                </Button>

                <p className="mt-4 text-center text-xs text-gray-500">
                    Demo credentials: <b>admin / admin123</b>
                </p>
            </div>
        </div>
    );
};

export default Login;
