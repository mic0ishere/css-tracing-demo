"use client";

import { useState } from "react";
import styles from "./DiceRoller.module.css";

export default function DiceRoller() {
  const [diceValue, setDiceValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);

  const rollDice = () => {
    let rolls = 0;
    setIsRolling(true);
    const rollInterval = setInterval(() => {
      const newValue = Math.floor(Math.random() * 6) + 1;
      setDiceValue(newValue);
      rolls++;
      if (rolls >= 10) {
        clearInterval(rollInterval);
        setIsRolling(false);
      }
    }, 70);
  };

  return (
    <>
      <div
        className={`${styles.dice} ${isRolling ? styles.rolling : ""}`}
        data-value={diceValue}
      >
        {diceValue}
      </div>
      <button className={styles.button} onClick={rollDice} disabled={isRolling}>
        {isRolling ? "Rolling..." : "Roll Dice"}
      </button>
    </>
  );
}
