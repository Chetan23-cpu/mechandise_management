"use client"
import styles from './css/asset.module.css'
import { MdModeEditOutline } from "react-icons/md";
import { MdDelete } from "react-icons/md";
import { useSearchParams } from "next/navigation";
import { IoArrowBackCircle } from "react-icons/io5";
import { useRouter } from "next/navigation";

const AssetSubheader = () => {
    const searchParams = useSearchParams();
    const locationName = searchParams.get("locationName") || "All Locations";
    const router = useRouter();

    return (
        <div className={styles.wrapper}>
            <div className={styles.subheader}>
                <div className={styles.location}>
                    <div className={styles.back}>
                        <div className={styles.icon} onClick={() => router.push("/location")}><IoArrowBackCircle /></div>
                        <div>{locationName} - Operational View</div> 
                        </div>
                    <div className={styles.change}>
                        <div className={styles.edit}><MdModeEditOutline /></div>
                        <div className={styles.delete}><MdDelete /></div>
                    </div>
                </div>
            </div> 
        </div>
    )
}

export default AssetSubheader;