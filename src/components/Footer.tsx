import clsx from "clsx";

interface FooterProps {
  leftContent: string;
  dataType: string;
  dataCount: number;
}

function Footer({ leftContent, dataType, dataCount }: FooterProps) {
  return (
    <div className={clsx(
      "sticky text-foreground bottom-0 flex flex-row w-full h-8 items-center justify-between",
      "px-6 shadow-md bg-footer/80 border-t border-footer-border backdrop-blur-sm z-10"
    )}>
      <div className="text-xs">
        {leftContent}
      </div>
      <div className="text-xs">
        {dataType}: <span className="text-brand-primary font-medium">{dataCount}</span>
      </div>
    </div>
  )
}

export default Footer;
