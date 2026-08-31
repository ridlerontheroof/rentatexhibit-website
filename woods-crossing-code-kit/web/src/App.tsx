import { Route, Switch } from "wouter";
import { Layout } from "./components/Layout";
import { SeoUpdater } from "./components/SeoUpdater";
import Home from "./pages/Home";
import FloorPlans from "./pages/FloorPlans";
import FloorPlanDetail from "./pages/FloorPlanDetail";
import Amenities from "./pages/Amenities";
import Neighborhood from "./pages/Neighborhood";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import Faqs from "./pages/Faqs";
import Knowledge from "./pages/Knowledge";
import KnowledgeArticle from "./pages/KnowledgeArticle";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import NeighborhoodGuides from "./pages/NeighborhoodGuides";
import NeighborhoodGuide from "./pages/NeighborhoodGuide";

const NotFound = () => (
  <div className="py-24 px-4 md:px-8 max-w-4xl mx-auto w-full text-center">
    <h1 className="text-4xl font-serif mb-4">404 - Not Found</h1>
    <p className="text-muted-foreground mb-8">The page you are looking for does not exist.</p>
  </div>
);

export function App() {
  return (
    <Layout>
      <SeoUpdater />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/floor-plans" component={FloorPlans} />
        <Route path="/floor-plans/:slug" component={FloorPlanDetail} />
        <Route path="/amenities" component={Amenities} />
        <Route path="/neighborhood" component={Neighborhood} />
        <Route path="/gallery" component={Gallery} />
        <Route path="/contact" component={Contact} />
        <Route path="/faqs" component={Faqs} />
        <Route path="/knowledge" component={Knowledge} />
        <Route path="/knowledge/:slug" component={KnowledgeArticle} />
        <Route path="/blog" component={Blog} />
        <Route path="/blog/:slug" component={BlogArticle} />
        <Route path="/neighborhood-guides" component={NeighborhoodGuides} />
        <Route path="/neighborhood-guides/:slug" component={NeighborhoodGuide} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}