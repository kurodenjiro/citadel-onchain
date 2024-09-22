"use client"
import Layout from "../components/layout"
import abi from '@/lib/ContractAbi.json'
import abiLend from '@/lib/ContractAbiLend.json'
import abiToken from '@/lib/ContractAbiToken.json'
import abiWorldID from '@/lib/abi.json'
import { IDKitWidget, ISuccessResult, useIDKit } from '@worldcoin/idkit'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, type BaseError, useReadContract } from 'wagmi'
import { decodeAbiParameters, parseAbiParameters } from 'viem'
import { useEffect, useState } from 'react'
import { toast } from'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from "next/link"


export default function IndexPage() {
    const account = useAccount()
    const { setOpen } = useIDKit()
    const [done, setDone] = useState(false)
    const { data: hash, isPending, error, writeContractAsync } = useWriteContract()
    const { isLoading: isConfirming, isSuccess: isConfirmed } = 
      useWaitForTransactionReceipt({
        hash,
    }) 
    const [isMinted, setIsMinted] = useState(false)
    const contractAddress = `0x9E102921DF5513f41213B3Beec4734C118AEcFeB`
    const [tokenId, setTokenId] = useState<string | null>(null)
    const [typeSubmit, setTypeSubmit] = useState<string | null>(null)
    const [valueStake, setValueStake] = useState<string | null>(null)

    useEffect(() => {
        const fetchTokenId = async () => {
            if (account.address) {
                const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY
                const apiUrl = `https://api-sepolia.etherscan.io/api?module=account&action=tokennfttx&contractaddress=${contractAddress}&address=${account.address}&sort=desc&apikey=${apiKey}`

                try {
                    const response = await fetch(apiUrl)
                    const data = await response.json()
                    if (data.status === '1' && data.result.length > 0) {
                        setTokenId(data.result[0].tokenID)
                    } else {
                        setTokenId(null)
                    }
                } catch (error) {
                    console.error('Error fetching token ID:', error)
                    setTokenId(null)
                }
            }
        }

        fetchTokenId()
    }, [account.address, contractAddress])

    const { data: nftType } = useReadContract({
        address: contractAddress,
        abi,
        functionName: 'ownerNftType',
        args: tokenId ? [account.address,BigInt(tokenId)] : undefined,
    })
    const { data: creditScore } = useReadContract({
      address: contractAddress,
      abi,
      functionName: 'getCreditScoreByAddress',
      args:  [account.address!]
    })

    

    const { data: canLend } = useReadContract({
      address: '0x91c0c1E8Bb63BEa1B92B16836EC68dFfD20F0C61',
      abi: abiLend,
      functionName: 'canTakeLoan',
      args:  [account.address!]
    })

    const { data: stakedBalance } = useReadContract({
      address: '0x91c0c1E8Bb63BEa1B92B16836EC68dFfD20F0C61',
      abi: abiLend,
      functionName: 'stakedBalanceOf',
      args:  [account.address!]
    })

    const { data: pendingReward } = useReadContract({
      address: '0x91c0c1E8Bb63BEa1B92B16836EC68dFfD20F0C61',
      abi: abiLend,
      functionName: 'getPendingRewards',
      args:  [account.address!]
    })
    
    console.log('canLend',canLend)
    console.log('pendingReward',pendingReward)
    useEffect(() => {
        if (nftType == "Netfix subscription") {
          setIsMinted(true)
        }
    }, [nftType])


    const submitTx = async (proof: ISuccessResult) => {
      try {
        await writeContractAsync({
          address: `0x9E102921DF5513f41213B3Beec4734C118AEcFeB`,
          account: account.address!,
          abi,
          functionName: 'buyCreditScoreNFT',
          args: [
            'Netfix subscription',
            account.address!,
            BigInt(proof!.merkle_root),
            BigInt(proof!.nullifier_hash),
            decodeAbiParameters(
              parseAbiParameters('uint256[8]'),
              proof!.proof as `0x${string}`
            )[0],
          ],
        })
        setDone(true)
        toast.success('Mint successful')
        setIsMinted(true)
        setTimeout(()=>{
          window.location.reload()
        },20000)
      } catch (error) {console.log(error)}
    }

    const onClaim = async (proof: ISuccessResult) => {
      try {
        await writeContractAsync({
          address: `0x91c0c1E8Bb63BEa1B92B16836EC68dFfD20F0C61`,
          account: account.address!,
          abi,
          functionName: 'claimRewards (0x372500ab)',
          args: [],
        })
        setDone(true)
        toast.success('Claim successful')
        setTimeout(()=>{
          window.location.reload()
        },20000)
      } catch (error) {console.log(error)}
    }

    const onStake = async (proof: ISuccessResult) => {
      try {
        await writeContractAsync({
          address: `0x91c0c1E8Bb63BEa1B92B16836EC68dFfD20F0C61`,
          account: account.address!,
          abi: abiLend,
          functionName: 'stake',
          args: [],
          value: BigInt(parseFloat(valueStake!)*10**18)
        })
        setDone(true)
        setValueStake('')
        toast.success('Stake successful')
        setTimeout(()=>{
          window.location.reload()
        },20000)
      } catch (error) {console.log(error)}
    }

    const onUnStake = async (proof: ISuccessResult) => {
      try {
        await writeContractAsync({
          address: `0x91c0c1E8Bb63BEa1B92B16836EC68dFfD20F0C61`,
          account: account.address!,
          abi: abiLend,
          functionName: 'unstake',
          args: [],
          value: BigInt(parseFloat(valueStake!)*10**18)
        })
        setDone(true)
        setValueStake('')
        toast.success('UnStake successful')
        setTimeout(()=>{
          window.location.reload()
        },20000)
      } catch (error) {console.log(error)}
    }

    const onLending = async (proof: ISuccessResult) => {
      if(Number(stakedBalance) > 0){
        try {
          await writeContractAsync({
            address: contractAddress,
            account: account.address!,
            abi,
            functionName: 'approveContract',
            args: [
              `0x91c0c1E8Bb63BEa1B92B16836EC68dFfD20F0C61`,
            ],
          })
          await writeContractAsync({
            address: `0x91c0c1E8Bb63BEa1B92B16836EC68dFfD20F0C61`,
            account: account.address!,
            abi: abiLend,
            functionName: 'takeLoan',
            args: [],
          })
          setDone(true)
          toast.success('Lending successful')
          setTimeout(()=>{
            window.location.reload()
          },20000)
        } catch (error) {console.log(error)}
      }else{
        toast.error('You must stake your credit score first')
      }
    }

  console.log('creditScore ',creditScore)
  return (
    <Layout>
      
      {
        account.isConnected&&
        (
          <IDKitWidget
            app_id={process.env.NEXT_PUBLIC_APP_ID as `app_${string}`}
            action={process.env.NEXT_PUBLIC_ACTION as string}
            signal={account?.address}
            onSuccess={typeSubmit == "mint"?submitTx:typeSubmit=="stake"?onStake:typeSubmit=="claim"?onClaim:typeSubmit=="unstake"?onUnStake:onLending}
            autoClose
          />
        )
      }
      <div className="max-w-6xl mx-auto p-4">
      {
        account?.address && (
          <div className="flex md:flex-row flex-col md:space-x-6 mb-10 gap-5 md:gap-0">
            <div className="bg-white shadow-md rounded-lg p-6 flex-1 flex items-center border border-gray-300">
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full border-8 border-gray-300 flex items-center justify-center text-gray-500 text-4xl font-bold">
                        {Array.isArray(creditScore) && creditScore.length > 0 ? creditScore[0].toString() : 0}
                        </div>
                        <div className="absolute -bottom-4 font-semibold left-[72%] transform text-xs -translate-x-1/2 text-gray-500 w-32 pb-10">
                            credit score
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center space-x-2">
                            <img width={20} src="/assets/user.svg" alt="My Humanity Score" />
                            <span className="text-gray-700 font-semibold">My Credit Score</span>
                            {/* <div className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full">Verified Human</div> */}
                        </div>
                        <div className="text-gray-500 mt-1">Amount available for loan.</div>
                    </div>
                </div>
            </div>
            <div className="bg-white shadow-md rounded-lg p-6 flex-1 border border-gray-300">
                <div className="flex items-center space-x-2 mb-4">
                    <img width={20} src="/assets/history.svg" alt="Recent Checks" />
                    <span className="text-gray-700 font-semibold">Recent Checks</span>
                    <span className="text-gray-500">0 Total Completed</span>
                </div>
            </div>
        </div> 
        )
      }
      <div className="flex flex-col md:flex-row w-full justify-between gap-5 mb-10">
        {
          account?.address && (
            <div className="border border-gray-300 rounded-lg p-5 shadow-sm w-1/2">
                  <h1 className="text-2xl font-bold mb-6">Stake</h1>
                  {account.isConnected && (
                      <div className="">
                          <h2 className="text-xl font-semibold mb-4">Your Staking Dashboard</h2>
                          <p className="text-lg mb-4">
                              Total Staked Amount: <span className="font-bold"> {Number(stakedBalance)/10**18} ETH</span>
                          </p>
                          <div className="flex items-center space-x-4">
                            <input
                                onChange={(e)=>setValueStake(e.target.value)}
                                type="text"
                                value={valueStake as string}
                                placeholder="Amount to stake"
                                className="border border-gray-300 rounded-md p-2 px-3 flex-grow outline-none"
                            />
                          </div>
                          <button onClick={()=>{
                              setTypeSubmit('stake')
                              setOpen(true)
                            }} className="button-mint float-end justify-end mt-5">
                              <span className="button_top-mint">Stake</span>
                          </button>
                      </div>
                      ) 
                  }
              </div>
          )
        }
        {
          account?.address && (
            <div className="border border-gray-300 rounded-lg p-5 shadow-sm w-1/2">
                  <h1 className="text-2xl font-bold mb-6">UnStake</h1>
                  {account.isConnected && (
                      <div className="">
                          <h2 className="text-xl font-semibold mb-4">Your unstake Dashboard</h2>
                          <p className="text-lg mb-4">
                              Total Staked Amount: <span className="font-bold">{Number(stakedBalance)/10**18} ETH</span>
                          </p>
                          <div className="flex items-center space-x-4">
                            <input
                                type="text"
                                value={''}
                                placeholder="Amount to widthdraw"
                                className="border border-gray-300 rounded-md p-2 px-3 flex-grow outline-none"
                            />
                            
                          </div>
                          <button onClick={()=>{
                              setTypeSubmit('unstake')
                              setOpen(true)
                            }} className="button-mint mt-4 float-end">
                                <span className="button_top-mint">UnStake</span>
                          </button>
                      </div>
                      )}
              </div>
          )
        }
        {
          account?.address && (
            <div className="border border-gray-300 rounded-lg p-5 shadow-sm w-1/2">
                  <h1 className="text-2xl font-bold mb-6">Claim Reward</h1>
                  {account.isConnected && (
                      <div className="relative h-full">
                          <h2 className="text-xl font-semibold mb-4">Your Claim Reward Dashboard</h2>
                          <p className="text-lg mb-4">
                              Total Amount Reward: <span className="font-bold">{(Number(pendingReward)/10**18).toFixed(10)} ETH</span>
                          </p>
                          <button onClick={()=>{
                              setTypeSubmit('claim')
                              setOpen(true)
                            }} className="button-mint mt-4 float-end absolute bottom-14 right-0">
                                <span className="button_top-mint">Claim</span>
                          </button>
                      </div>
                      ) }
              </div>
          )
        }
      </div>
        <section>
          <h2 className="text-3xl font-bold mb-2">
            NFT Credit Score
          </h2>
          <p className="mb-4">
            A unique collection of digital art NFTs that fuse creativity with innovation.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="bg-white rounded-lg shadow-lg p-4 max-w-xs border border-gray-200">
                <img 
                    alt="A futuristic, robotic device with a yellow and gray color scheme" 
                    className="rounded-lg border border-gray-200 p-2 transition-transform duration-300 ease-in-out hover:scale-105" 
                    height="400" 
                    src="/assets/background.jpg" 
                    width="400"
                />
                <div className="p-4">
                  <Link href={`https://sepolia.etherscan.io/address/0x9E102921DF5513f41213B3Beec4734C118AEcFeB`} target="_blank" className="text-gray-400 text-sm hover:underline">
                    
                    {
                      "0x9E102921DF5513f41213B3Beec4734C118AEcFeB".slice(0, 20) + "..."
                    }
                    
                  <i className="fas fa-check-circle text-yellow-500">
                  </i>
                  </Link>
                  <div className="text-black text-lg font-bold mt-1">
                  Credit Score From Citadel Bank
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-gray-400 text-sm">
                      <div className="mt-1">
                      Price
                      </div>
                      <div className="text-black font-bold mt-1">
                      0.023 ETH
                      </div>
                    </div>
                    {
                      !done && !isMinted && <button disabled={isPending} onClick={()=>{
                        setTypeSubmit('mint')
                        setOpen(true)
                      }} className="button-mint mt-4 flex flex-row">
                          <span className="button_top-mint">{isConfirming ?
                            <div className="flex flex-row items-center gap-1">
                              <span>isPending</span>
                              <img width={25} src="/assets/reload.svg" alt="icon" />
                            </div>
                          : 'Mint'}</span>
                          
                      </button>
                    }
                    {
                      isMinted && <button disabled={isPending} onClick={()=>{
                        setTypeSubmit('lending')
                        setOpen(true)
                      }} className="button-mint mt-4">
                          <span className="button_top-mint">Lending</span>
                      </button>
                    }
                  </div>
                </div>
                </div>
          </div>
        </section>
      </div>
    </Layout>
  )
}
