import type { CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Beef,
  Bird,
  ChefHat,
  Fish,
  Shell,
  Shrimp,
  type LucideIcon,
} from "lucide-react";
import { chefCategoryThemes } from "@/components/flavor-map/chefCategoryThemes";
import styles from "@/components/flavor-map/FlavorMap.module.css";
import type {
  ChefCategoryViewModel,
  RecipeCategoryId,
} from "@/types/classification";

type ChefTicketProps = {
  category: ChefCategoryViewModel;
  index: number;
};

type TicketStyle = CSSProperties & {
  "--ticket-paper": string;
  "--ticket-accent": string;
  "--ticket-text": string;
};

const categoryIcons: Record<RecipeCategoryId, LucideIcon> = {
  chicken: Bird,
  duck: Bird,
  pork: Beef,
  beef: Beef,
  lamb: Beef,
  fish: Fish,
  shrimp: Shrimp,
  crab: Shell,
  other: ChefHat,
};

export function ChefTicket({ category, index }: ChefTicketProps) {
  const theme = chefCategoryThemes[category.id];
  const Icon = categoryIcons[category.id];
  const ticketStyle: TicketStyle = {
    "--ticket-paper": theme.paper,
    "--ticket-accent": theme.accent,
    "--ticket-text": theme.text,
  };
  const latestText = category.latestRecipeName
    ? `最近新增：${category.latestRecipeName}`
    : "还没有新的菜谱";
  const depth = index === 0 ? "0" : index < 4 ? "1" : "2";
  const stampRingId = `chef-stamp-${category.id}`;

  return (
    <Link
      href={category.href}
      aria-label={`进入${category.displayName}分类`}
      className={`${styles.ticketLink} block active:scale-[0.985] active:brightness-[0.98]`}
      data-depth={depth}
      style={ticketStyle}
    >
      <article
        className={styles.ticket}
        data-depth={depth}
        data-empty={category.isEmpty ? "true" : "false"}
      >
        <section className={styles.main}>
          <p className={styles.eyebrow}>FLAVOR TICKET</p>
          <h2 className={styles.title}>{category.displayName}</h2>
          <p className={styles.description}>{category.description}</p>

          <div className={styles.meta}>
            <span className={styles.iconSeal} aria-hidden="true">
              <Icon size={22} strokeWidth={1.6} />
            </span>
            <div className={styles.details}>
              <p className={styles.count}>
                已收藏 {category.recipeCount} 道
              </p>
              <p className={styles.latest} title={latestText}>
                {latestText}
              </p>
            </div>
          </div>

          <span className={styles.stamp} aria-hidden="true">
            <svg
              className={styles.stampArtwork}
              viewBox="0 0 100 100"
              role="presentation"
            >
              <defs>
                <path
                  id={stampRingId}
                  d="M 50,50 m -40,0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0"
                />
              </defs>
              <circle
                className={styles.stampOuterRing}
                cx="50"
                cy="50"
                r="46"
              />
              <circle
                className={styles.stampInnerRing}
                cx="50"
                cy="50"
                r="31"
              />
              <text className={styles.stampText}>
                <textPath href={`#${stampRingId}`} startOffset="2%">
                  TASTE ARCHIVE • CHEF COLLECTION •
                </textPath>
              </text>
              <path
                className={styles.stampDivider}
                d="M22 50h9M69 50h9"
              />
            </svg>
            <Icon
              className={styles.stampAnimal}
              size={25}
              strokeWidth={1.35}
            />
            <span className={styles.stampNumber}>
              NO. {String(index + 1).padStart(2, "0")}
            </span>
            <span className={styles.stampDistress} />
          </span>
        </section>

        <aside className={styles.stub} aria-hidden="true">
          <span className={`${styles.perforation} chef-ticket-perforation`} />

          <div>
            <p className={styles.stubLabel}>CHEF</p>
            <p className={styles.number}>
              {String(index + 1).padStart(2, "0")}
            </p>
          </div>

          <p className={styles.english}>{category.englishName}</p>
          <ArrowRight className={styles.arrow} size={18} strokeWidth={1.5} />
          <span className={`${styles.barcode} chef-ticket-barcode`} />
        </aside>
      </article>
    </Link>
  );
}
