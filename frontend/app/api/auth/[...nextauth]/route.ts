import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';

const BLOCKED_DOMAINS = ['mailinator', 'temp-mail', 'guerrillamail', 'throwam', 'yopmail'];

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId:     process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) return false;
      if (BLOCKED_DOMAINS.some((d) => profile.email!.includes(d))) return false;
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as typeof session.user & { id: string }).id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error:  '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
