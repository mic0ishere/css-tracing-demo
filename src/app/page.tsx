import DiceRoller from "@/components/DiceRoller";

import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.container}>
      <DiceRoller />
    </main>
  );
}
