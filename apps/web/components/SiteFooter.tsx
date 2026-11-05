import { Disclaimer } from "@/components/Disclaimer";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p className="site-footer__meta">Important</p>
        <Disclaimer />
      </div>
    </footer>
  );
}
