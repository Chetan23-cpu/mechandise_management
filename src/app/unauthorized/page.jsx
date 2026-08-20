import Image from "next/image";
import Link from "next/link";
import styles from "./unauthorized.module.css";

export default function Unauthorized() {
  return (
    <div className={styles.page}>
      <div className={styles.imageSection}>
        <Image
          src="/images/access_denied2.jpg"
          alt="Access Denied"
          width={650}
          height={650} 
          style={{ width: "90%", maxWidth: "650px", height: "auto" }}
        />
      </div>

      <div className={styles.textSection}>
        <div className={styles.section}>
          <div className={styles.head}>403!</div>

          <h3 className={styles.access}>Access Denied</h3>

          <div className={styles.contact}>
            <div className={styles.assistance}>Need Assistance?</div>

            <div className={styles.query}>
              For any queries or issues, please contact our support team.
            </div>

            <div className={styles.contactDetails}>
              <div>
                <span className={styles.text}>Email: </span>
                
              </div>

              <div>
                <span className={styles.text}>Address: </span>
                Killarney
              </div>

              <div>
                <span className={styles.text}>Phone: </span>
                
              </div>
            </div>
          </div>

          <Link href="/location" className={styles.button}>
            Back To Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
