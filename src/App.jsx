import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Users from './pages/Users';
import Categories from './pages/Categories';
import SubCategories from './pages/SubCategories';
import FrameSizes from './pages/FrameSizes';
import LensOptions from './pages/LensOptions';
import LensTypes from './pages/LensTypes';
import LensCoatings from './pages/LensCoatings';
import LensColors from './pages/LensColors';
import LensFinishes from './pages/LensFinishes';
import LensTreatments from './pages/LensTreatments';
import LensThicknessMaterials from './pages/LensThicknessMaterials';
import LensThicknessOptions from './pages/LensThicknessOptions';
import Prescriptions from './pages/Prescriptions';
import PrescriptionLensTypes from './pages/PrescriptionLensTypes';
import PrescriptionLensVariants from './pages/PrescriptionLensVariants';
import Coupons from './pages/Coupons';
import Campaigns from './pages/Campaigns';
import Banners from './pages/Banners';
import BlogPosts from './pages/BlogPosts';
import FAQs from './pages/FAQs';
import Pages from './pages/Pages';
import Testimonials from './pages/Testimonials';
import Menus from './pages/Menus';
import Simulations from './pages/Simulations';
import Jobs from './pages/Jobs';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import Overview from './pages/Overview';

// Forms Module
import ContactRequests from './pages/forms/ContactRequests';
import DemoRequests from './pages/forms/DemoRequests';
import PricingRequests from './pages/forms/PricingRequests';
import JobApplications from './pages/forms/JobApplications';
import CredentialsRequests from './pages/forms/CredentialsRequests';
import SupportRequests from './pages/forms/SupportRequests';

// Layout
import Layout from './components/Layout';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />

                    {/* Website Forms Module */}
                    <Route path="/forms/contact" element={<ContactRequests />} />
                    <Route path="/forms/demo" element={<DemoRequests />} />
                    <Route path="/forms/pricing" element={<PricingRequests />} />
                    <Route path="/forms/credentials" element={<CredentialsRequests />} />
                    <Route path="/forms/support" element={<SupportRequests />} />
                    <Route path="/forms/job-applications" element={<JobApplications />} />

                    <Route path="/products" element={<Products />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/subcategories" element={<SubCategories />} />
                    <Route path="/frame-sizes" element={<FrameSizes />} />
                    <Route path="/lens-options" element={<LensOptions />} />
                    <Route path="/lens-types" element={<LensTypes />} />
                    <Route path="/lens-coatings" element={<LensCoatings />} />
                    <Route path="/lens-colors" element={<LensColors />} />
                    <Route path="/lens-finishes" element={<LensFinishes />} />
                    <Route path="/lens-treatments" element={<LensTreatments />} />
                    <Route path="/lens-thickness-materials" element={<LensThicknessMaterials />} />
                    <Route path="/lens-thickness-options" element={<LensThicknessOptions />} />
                    <Route path="/prescriptions" element={<Prescriptions />} />
                    <Route path="/prescription-lens-types" element={<PrescriptionLensTypes />} />
                    <Route path="/prescription-lens-variants" element={<PrescriptionLensVariants />} />
                    <Route path="/coupons" element={<Coupons />} />
                    <Route path="/campaigns" element={<Campaigns />} />
                    <Route path="/banners" element={<Banners />} />
                    <Route path="/blog" element={<BlogPosts />} />
                    <Route path="/faqs" element={<FAQs />} />
                    <Route path="/pages" element={<Pages />} />
                    <Route path="/menus" element={<Menus />} />
                    <Route path="/testimonials" element={<Testimonials />} />
                    <Route path="/simulations" element={<Simulations />} />
                    <Route path="/jobs" element={<Jobs />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/overview" element={<Overview />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
