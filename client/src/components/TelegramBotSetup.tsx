import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Bot, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function TelegramBotSetup() {
  const [botToken, setBotToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!botToken.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid Telegram bot token",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Send the token to our backend API
      const response = await apiRequest(
        "POST", 
        "/api/admin/telegram-bot-token",
        { token: botToken.trim() }
      );
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: data.message || "Telegram bot has been configured successfully!",
        });
        
        setIsConfigured(true);
      } else {
        throw new Error(data.message || "Failed to configure Telegram bot");
      }
    } catch (error) {
      console.error("Error configuring Telegram bot:", error);
      let errorMessage = "There was an error configuring the Telegram bot. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bot className="h-5 w-5 mr-2 text-primary" />
          Configure Telegram Bot
        </CardTitle>
        <CardDescription>
          Enter your Telegram bot token to enable the Telegram recovery functionality
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConfigured ? (
          <Alert className="bg-green-900 bg-opacity-10 border border-green-700">
            <Check className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-200">
              Telegram bot has been configured! Users can now interact with your bot to recover their funds.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert className="bg-blue-900 bg-opacity-10 border border-blue-700 mb-4">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-100">
                To enable the Telegram bot, you need to create a bot on Telegram and get a token from BotFather.
                <a 
                  href="https://core.telegram.org/bots#how-do-i-create-a-bot" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block mt-2 text-blue-400 underline hover:text-blue-300"
                >
                  Learn how to create a Telegram bot
                </a>
              </AlertDescription>
            </Alert>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="botToken" className="block text-sm font-medium">
                    Telegram Bot Token
                  </label>
                  <Input
                    id="botToken"
                    placeholder="1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                    className="w-full"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Your token looks like: 123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Configuring..." : "Configure Bot"}
                </Button>
              </div>
            </form>
          </>
        )}
      </CardContent>
      {isConfigured && (
        <CardFooter className="flex justify-center">
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => setIsConfigured(false)}
          >
            Reconfigure Bot
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}