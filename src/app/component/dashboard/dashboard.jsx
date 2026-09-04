"use client";
import styles from "./css/dashboard.module.css";
import MidCard1 from "./elements/midcard1";
import MidCard2 from "./elements/midcard2";
import Topcard1 from "./elements/topcard1";
import Topcard2 from "./elements/topcard2";
import Topcard3 from "./elements/topcard3";
import Topcard4 from "./elements/topcard4";

const DashboardLayout = () => {
  return (
    <div className={styles.main}>
      <div className={styles.toprow}>
        <Topcard1 />
        <Topcard2 />
        <Topcard3 />
      </div>
      <div className={styles.secondrow}>
        <MidCard1 />
        <MidCard2 />
      </div>
    </div>
  );
};

export default DashboardLayout;
