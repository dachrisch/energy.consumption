import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    newUser: "/register",
    signIn: "/login", 

  },
});