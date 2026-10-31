import type { Metadata } from 'next';
import './globals.css';
import './themes.css';
import './arcade.css';
import './practice.css';
import './studio.css';
import './expansion.css';
import './room.css';
import './refinements.css';
import {themeInitScript} from '../lib/client-state';
export const metadata: Metadata = {title:'Markup — Your next line starts here',description:'Learn HTML and CSS with visual practice, source-linked documentation, a live playground, and fourteen coding and casual games, six snake maps, and UNO rooms for up to twelve players.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:themeInitScript}}/></head><body>{children}</body></html>}
