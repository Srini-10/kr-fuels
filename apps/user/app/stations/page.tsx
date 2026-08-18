import type { Metadata } from "next";
import { getStations } from "@/lib/api";
import { StationsExplorer } from "@/components/StationsExplorer";
import { STATIONS_FALLBACK } from "@/lib/fallbacks";
import { STATION_COUNT_FALLBACK, fmtCount } from "@/lib/site";

export const metadata: Metadata = {
  title: "Auto LPG Stations",
  description: "Find your nearest K.R Trans Fuels Auto LPG station across Tamil Nadu. Filter by district and amenities.",
};

// ISR: station network changes rarely — serve from cache, refresh in background.
export const revalidate = 60;

export default async function StationsPage() {
  const stations = await getStations();
  // Real backend data wins; fall back to a representative set when empty.
  const list = stations.data.length ? stations.data : STATIONS_FALLBACK;
  const count = stations.total > 0 ? stations.total : STATION_COUNT_FALLBACK;

  return (
    <>
      <section className="bg-gradient-to-b from-brand-pale/60 to-white">
        <div className="container-x py-14 text-center">
          <span className="eyebrow mb-4">Station network</span>
          <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">{fmtCount(count)} Auto LPG stations</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-mutedfg">
            Tamil Nadu's largest network — find the station nearest you.
          </p>
        </div>
      </section>

      <section className="container-x py-14">
        <StationsExplorer stations={list} />
      </section>
    </>
  );
}
