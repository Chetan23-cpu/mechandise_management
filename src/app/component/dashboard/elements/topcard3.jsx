import styles from "../css/topcard3.module.css"

const Topcard3 = () =>{
    return (
        <div>
            <div className={styles.card}>
                <div className={styles.title}>
                    <div className={styles.heading}>Merchandise Movement</div>
                    <div className={styles.button}>
                        <button className={styles.monthly}>Monthly</button>
                        <button className={styles.quaterly}>Quarterly</button>
                        <button className={styles.yearly}>Yearly</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Topcard3;