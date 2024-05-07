import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MedHints",
  description: "Criação fácil e eficiênte de receitas para profisionais",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        </body>
    </html>
  );
}


//Schedule:
//1) Auth functionality -> Fix auth: https://supabase.com/docs/guides/auth/server-side/nextjs - done
//2) Make dasboard page more responsive - done
//2) Load initial medicines from database - done
//3) Add ability to add medicines to the prescription - done
//4) Add formula + description + character width limit - done
//5) Add inputs that make the values editable - done
//6) Add search functionality for the list of medicines avaliable - done
//6) Add ability to add new medicines to the database - done
//7) Add logout button - done
//7) Add ability to save prescription - done
//8) Add ability to copy - done
//9) Add ability to print - done
//9) Add ability to edit and delete medicines - done
//10) Add ability to edit and delete saved prescriptions - done
//11) Admin panel

//supabase account: plourenco1548@gmail.com


//TODO:
//add ability to treat hours section as a single element

//VPS info:
//hostname: srv517589.hstgr.cloud
//root password: MedApp17#
