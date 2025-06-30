import Navbar from "../components/navbar";
import HomeSection from "../section/home";
import RobotLottie from '@/components/RobotLottie';

export default function Home() {
  return (
    <div className="pt-16">
      <Navbar />
      <div className="text-9xl font-bold text-white">
        <HomeSection />
      </div>
      <RobotLottie/>
    </div>
  );
}
