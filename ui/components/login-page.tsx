'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Web3 } from 'web3'
import { API_CONFIG, fetchApi } from '@/config/api'
import { setAuthState } from '@/services/auth'

// 声明全局 ethereum 对象
declare global {
  interface Window {
    ethereum?: any;
    mina?: any;  // Auro wallet global object
  }
}

interface LoginPageProps {
  onLogin?: (address: string) => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnectingAuro, setIsConnectingAuro] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true)

      // 检查是否安装了MetaMask
      if (!window.ethereum) {
        toast({
          title: "错误",
          description: "请先安装MetaMask钱包",
          variant: "destructive"
        })
        return
      }

      // 请求连接钱包
      const web3 = new Web3(window.ethereum)
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found')
      }

      const walletAddress = accounts[0]

      // 使用简单的签名消息，与 Auro 类似
      const message = "Sign this message to login to PAW"

      // 请求签名
      const signature = await web3.eth.personal.sign(
        message,
        walletAddress,
        ''
      )

      // 调用登录接口
      const response = await fetchApi(API_CONFIG.PATHS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify({
          wallet_address: walletAddress,
          signature: signature,
          message: message,
          wallet_type: 'ethereum'
        })
      })

      const data = await response.json()

      // 保存登录状态
      setAuthState({
        token: data.access_token,
        walletAddress: data.wallet_address,
        username: data.username,
        expiresAt: data.expires_at,
        walletType: data.wallet_type
      })

      // 调用登录回调
      if (onLogin) {
        onLogin(data.wallet_address)
      }

      // 使用 window.location.href 进行跳转
      window.location.href = '/stories'

    } catch (error) {
      console.error('Login error:', error)
      toast({
        title: "登录失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      })
    } finally {
      setIsConnecting(false)
    }
  }

  // 处理 Auro 钱包连接
  const handleConnectAuro = async () => {
    try {
      setIsConnectingAuro(true)

      // 检查是否安装了 Auro 钱包
      if (!window.mina) {
        toast({
          title: "Error",
          description: "Please install Auro wallet first",
          variant: "destructive"
        })
        return
      }

      console.log('Requesting Auro wallet connection...')
      // 请求连接 Auro 钱包
      const accounts = await window.mina.requestAccounts()
      console.log('Auro accounts:', accounts)
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No Mina accounts found')
      }

      const walletAddress = accounts[0]
      console.log('Selected Auro wallet address:', walletAddress)

      // 生成简单的签名消息
      const message = "Sign this message to login to PAW"
      console.log('Requesting message signature...')

      // 使用简化的签名请求
      const signResult = await window.mina.signMessage({
        message
      })
      console.log('Signature result:', signResult)

      // 将签名对象转换为字符串格式
      const signature = JSON.stringify(signResult.signature)

      console.log('Calling login API...')
      // 调用登录接口
      const response = await fetchApi(API_CONFIG.PATHS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify({
          wallet_address: walletAddress,
          signature: signature,
          message: message,
          wallet_type: 'mina'
        })
      })

      console.log('Login API response:', response)
      const data = await response.json()
      console.log('Login API data:', data)

      // 保存登录状态
      await new Promise(resolve => {
        setAuthState({
          token: data.access_token,
          walletAddress: data.wallet_address,
          username: data.username,
          expiresAt: data.expires_at,
          walletType: data.wallet_type
        })
        // 给一个短暂的延时确保状态保存完成
        setTimeout(resolve, 100)
      })

      // 调用登录回调
      if (onLogin) {
        onLogin(data.wallet_address)
      }

      console.log('Auro wallet login successful:', {
        wallet_address: data.wallet_address,
        username: data.username,
        timestamp: new Date().toISOString()
      })

      // 确保状态已经保存后再跳转
      setTimeout(() => {
        console.log('Redirecting to stories page...')
        window.location.href = '/stories'
      }, 200)

    } catch (error) {
      console.error('Auro login error:', error)
      // 添加更详细的错误信息
      let errorMessage = "Unknown error"
      if (error instanceof Error) {
        errorMessage = error.message
        // 添加更多错误详情到控制台
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
      }
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsConnectingAuro(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-slate-900 to-black flex flex-col items-center justify-center p-8">
      <div className="text-center">
        <div className="flex items-center justify-center mb-6">
          <Image 
            src="https://img.oocstorage.icu/file/oocstorage/paw_logo.png"
            alt="PAW Logo"
            width={64}
            height={64}
          />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Welcome to PAW</h1>
        <div className="flex flex-col items-center mt-2 mb-8">
          <p className="text-lg text-gray-400">OOCAI-Incubated Agent Application</p>
          <div className="w-full h-px bg-gray-700 mt-6" />
        </div>
        <div className="flex flex-col gap-4">
          <Button
            onClick={handleConnectWallet}
            disabled={isConnecting}
            variant="default"
            size="lg"
            className="bg-amber-500 hover:bg-amber-600"
          >
            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </Button>
          <Button
            onClick={handleConnectAuro}
            disabled={isConnectingAuro}
            variant="default"
            size="lg"
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isConnectingAuro ? 'Connecting...' : 'Connect Auro Wallet'}
          </Button>
        </div>
      </div>
    </div>
  )
}

