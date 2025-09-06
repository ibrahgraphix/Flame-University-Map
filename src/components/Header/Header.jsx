// src/components/Header/Header.jsx
import React from "react";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.logoWrap}>
          <div className={styles.logoInner}>
            <i className="fas fa-fire"></i>
          </div>
        </div>
        <div>
          <h1 className={styles.title}>FLAME Campus Navigation</h1>
          <p className={styles.subtitle}>Navigate Places</p>
        </div>
      </div>
      <div className={styles.right}>
        <button className={styles.iconBtn} title="Toggle fullscreen">
          <i className="fas fa-expand"></i>
        </button>
      </div>
    </header>
  );
}
