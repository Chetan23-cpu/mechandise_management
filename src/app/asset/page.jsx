"use client"
import Assetheader from "../component/asset/header";
import AssetSubheader from "../component/asset/suheader";
import AssetMain from "../component/asset/main";
import { Suspense } from "react";

const Asset = () => {
    return (
        <div style={{ backgroundColor: "#faebd7" }}>
            <Assetheader />
            <Suspense fallback={<div>Loading...</div>}>
                <AssetSubheader />
            </Suspense>
            <Suspense fallback={<div>Loading...</div>}>
                <AssetMain />
            </Suspense>
        </div>
    )
}

export default Asset;