import {Contract, JsonRpcProvider, Signer, Wallet, parseEther, parseUnits} from 'ethers'

const PRIVATE_KEY = process.env.PRIVATE_KEY
const USDC_CONTRACT = '0x1870Dc7A474e045026F9ef053d5bB20a250Cc084'
const ALLOCATE_ETH_AMOUNT = '0.000075'

// 感謝 https://www.4byte.directory/signatures/
const CONTRACT_ABI = [
  'function claimDrip()',
  'function transfer(address, uint256)'
]

const sleep = async (n: number) =>
  new Promise((r) => setTimeout(() => r(null), n))


const getContract = () => new Contract(USDC_CONTRACT, CONTRACT_ABI)

const createSigner = (privateKey: string | null) => {
  const provider = new JsonRpcProvider('https://arbitrum-sepolia.blockpi.network/v1/rpc/public', 421614)
  if (privateKey) {
    return new Wallet(privateKey, provider)
  } else {
    const wallet = Wallet.createRandom()
    return new Wallet(wallet.privateKey, provider)
  }
}

const allocateETH = async (address: string) => {
  const signer = createSigner(PRIVATE_KEY)

  const tx = await signer.sendTransaction({
    to: address,
    value: parseEther(ALLOCATE_ETH_AMOUNT)
  })

  await tx.wait()
  return tx
} 

const mintUSDC = async (signer: Signer) => {
  const payload = getContract().interface.encodeFunctionData('claimDrip', [])
  const tx = await signer.sendTransaction({
    to: USDC_CONTRACT,
    data: payload
  })

  await tx.wait()
  return tx
}

const transferUSDC = async (signer: Signer) => {
  const payload = getContract().interface.encodeFunctionData('transfer', [
    createSigner(PRIVATE_KEY).address,
    parseUnits('100', 6)
  ])
  const tx = await signer.sendTransaction({
    to: USDC_CONTRACT,
    data: payload
  })

  await tx.wait()
  return tx
}


const main = async () => {
  const newSigner = createSigner(null)

  try {
    const allocatedTx = await allocateETH(newSigner.address)
    console.log(`${newSigner.address} 🌟 allocated ETH: ${allocatedTx.hash}`)

    await sleep(3000)

    const mintTx = await mintUSDC(newSigner)
    console.log(`${newSigner.address} 🍃 minted USDC: ${mintTx.hash}`)

    await sleep(3000)

    const transferTx = await transferUSDC(newSigner)
    console.log(`${newSigner.address} 🚀 transfered USDC: ${transferTx.hash}`)
  } catch (e) {
    console.log(`${newSigner.address} 🔥 ${e.message}`)
  }
  
  main()
};

main();
