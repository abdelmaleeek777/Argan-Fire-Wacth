import React from "react";

/**
 * Login page — allows cooperative holders and admins to sign in.
 */
function Login() {
  return (
    <div className="page public-login">
      <h1>Sign In</h1>
      <form>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="your@email.com"
        />

        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="••••••••"
        />

        <button type="submit">Sign In</button>
      </form>
    </div>
  );
}

export default Login;
