import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import RecoveryTool from "@/pages/RecoveryTool";
import TelegramBotPage from "@/pages/TelegramBotPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={TelegramBotPage} />
      <Route path="/legacy" component={RecoveryTool} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
