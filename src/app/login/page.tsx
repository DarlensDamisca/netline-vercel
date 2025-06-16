'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, Input, Button } from "@nextui-org/react";
import { FaUser, FaLock } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Call our authentication API endpoint
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Login successful
        const { user } = data;
        
        // Store user info in localStorage
        localStorage.setItem('currentUser', JSON.stringify({
          id: user.id,
          name: user.name,
          complete_name: user.complete_name,
          firstname: user.firstname,
          lastname: user.lastname,
          user_number: user.user_number,
          type: user.type
        }));
        
        // Redirect to dashboard
        router.push('/');
      } else {
        // Login failed
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div 
        className="w-full max-w-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">NETLINE CONTROL</h1>
        </div>
        
        <Card className="shadow-md">
          <CardBody className="p-6">
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {error && (
                <div className="bg-blue-900/20 text-blue-800 dark:text-blue-200 p-3 rounded-lg text-center text-sm border border-blue-900/30">
                  {error}
                </div>
              )}
              
              <Input
                label="Username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                startContent={<FaUser className="text-default-400" />}
                variant="flat"
                isRequired
                classNames={{
                  inputWrapper: ["bg-default-100"]
                }}
              />
              
              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                startContent={<FaLock className="text-default-400" />}
                type="password"
                variant="flat"
                isRequired
                classNames={{
                  inputWrapper: ["bg-default-100"]
                }}
              />
              
              <Button 
                type="submit" 
                color="primary" 
                className="mt-2" 
                isLoading={isLoading}
                fullWidth
              >
                Sign In
              </Button>
            </form>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}
