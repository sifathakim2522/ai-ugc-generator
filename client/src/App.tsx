import Navbar from './components/Navbar';
import Home from './pages/Home';
import SoftBackdrop from './components/SoftBackdrop';
import Footer from './components/Footer';
import LenisScroll from './components/lenis';
import { Routes, Route } from 'react-router-dom';
import Generator from './pages/Generator';
import Results from './pages/Results';
import Loading from './pages/Loading';
import Plans from './pages/Plans';
import MyGenerations from './pages/MyGenerations';
import Community from './pages/Community';

function App() {
	return (
		<>
			<SoftBackdrop />
			<LenisScroll />
			<Navbar />
			<Routes>
				{/* Public routes */}
				<Route path="/" element={<Home />} />
				<Route path="/plans" element={<Plans />} />
				<Route path="/community" element={<Community />} />

				{/* Protected routes */}
				<Route path="/generator" element={<Generator />} />
				<Route path="/results/:projectId" element={<Results />} />
				<Route path="/loading/:projectId" element={<Loading />} />
				<Route path="/my-generations" element={<MyGenerations />} />
			</Routes>
			<Footer />
		</>
	);
}
export default App;
