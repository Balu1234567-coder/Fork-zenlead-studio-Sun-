import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Info, RefreshCw } from "lucide-react";

const DebugApiStatus: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<string>('Not checked');
  const [apiStatus, setApiStatus] = useState<string>('Not checked');
  const [testing, setTesting] = useState(false);

  const testAuth = () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setAuthStatus('No token found');
      return;
    }
    
    try {
      // Basic JWT decode to check if token is expired
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      
      if (payload.exp && payload.exp < now) {
        setAuthStatus('Token expired');
      } else {
        setAuthStatus('Token valid');
      }
    } catch (error) {
      setAuthStatus('Token invalid format');
    }
  };

  const testApiConnection = async () => {
    setTesting(true);
    try {
      // Test a simple API endpoint
      const response = await fetch('/api/ai/models', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setApiStatus(`API responding: ${response.status}`);
      } else {
        setApiStatus(`API error: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      setApiStatus(`API connection failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const clearState = () => {
    localStorage.removeItem('book_generation_state');
    localStorage.removeItem('project_history');
    setAuthStatus('Not checked');
    setApiStatus('Not checked');
  };

  return (
    <Card className="max-w-md mx-auto m-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          API Debug Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Auth Token:</span>
            <Badge variant={authStatus.includes('valid') ? 'default' : 'destructive'}>
              {authStatus}
            </Badge>
          </div>
          <Button size="sm" variant="outline" onClick={testAuth}>
            Check Auth
          </Button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">API Connection:</span>
            <Badge variant={apiStatus.includes('200') ? 'default' : 'destructive'}>
              {apiStatus}
            </Badge>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={testApiConnection}
            disabled={testing}
          >
            {testing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Test API'
            )}
          </Button>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            If you're seeing "Failed to get status: 500" errors, try clearing stored state and refreshing.
          </AlertDescription>
        </Alert>

        <Button size="sm" variant="destructive" onClick={clearState}>
          Clear All State
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <div>Current URL: {window.location.pathname}</div>
          <div>Auth Token: {localStorage.getItem('auth_token') ? 'Present' : 'Missing'}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugApiStatus;
