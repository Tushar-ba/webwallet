const ethers = require('ethers');

async function getTransactionsPerDay(rpcUrl, startBlock = null, endBlock = null) {
    try {
        // Connect to your L3 chain
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        // Get current block if endBlock not specified
        if (!endBlock) {
            endBlock = await provider.getBlockNumber();
        }
        console.log({endBlock})
        // If startBlock not specified, get blocks from last 24 hours
        if (!startBlock) {
            const latestBlock = await provider.getBlock(endBlock);
            const oneDayAgo = latestBlock.timestamp - 60 * 60;
            
            // Find block nearest to 24 hours ago
            startBlock = await findBlockByTimestamp(provider, oneDayAgo);
        }
        console.log({startBlock})
        // Initialize counters
        const dailyTxs = {};
        console.log("start fetching trx")
        // Process blocks in batches to avoid rate limiting
        const batchSize = 100;
        for (let i = startBlock; i <= endBlock; i += batchSize) {
            const promises = [];
            const end = Math.min(i + batchSize - 1, endBlock);
            
            for (let blockNum = i; blockNum <= end; blockNum++) {
                promises.push(provider.getBlock(blockNum));
            }
            
            const blocks = await Promise.all(promises);
            
            blocks.forEach(block => {
                if (block) {
                    const date = new Date(block.timestamp * 1000).toISOString().split('T')[0];
                    dailyTxs[date] = (dailyTxs[date] || 0) + block.transactions.length;
                }
            });
        }
        
        return dailyTxs;
        
    } catch (error) {
        console.error('Error fetching transactions:', error);
        throw error;
    }
}

async function findBlockByTimestamp(provider, targetTimestamp) {
    let left = 1;
    let right = await provider.getBlockNumber();
    
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const block = await provider.getBlock(mid);
        
        if (!block) {
            right = mid - 1;
            continue;
        }
        
        if (block.timestamp === targetTimestamp) {
            return mid;
        }
        
        if (block.timestamp < targetTimestamp) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    return left;
}

// Example usage
async function main() {
    const rpcUrl = "https://rpc.easier-dawn-equator.t.raas.gelato.cloud";
    
    try {
        console.log('Start fetching perday trx');
        const txsPerDay = await getTransactionsPerDay(rpcUrl);
        console.log('Transactions per day:', txsPerDay);
        
        // Calculate total transactions
        const totalTxs = Object.values(txsPerDay).reduce((a, b) => a + b, 0);
        console.log('Total transactions:', totalTxs);
        
    } catch (error) {
        console.error('Error in main:', error);
    }
}

// Call the main function
main().catch(console.error);