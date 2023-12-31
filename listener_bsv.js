const { Listener } = require("bsv-spv");
const { connect } = require("amqplib");

const name = "bsv-listener";
const ticker = "BSV";
const blockHeight = -10; // Number. If negative then it's number from the tip.
const dataDir = __dirname;
const port = 8080; // Same as Masters port above
const listener = new Listener({ name, ticker, blockHeight, dataDir });

var amqp;

async function startAmqp() {
  const connection = await connect("amqp://guest:guest@localhost:5672");

  amqp = await connection.createChannel();

  await amqp.assertExchange("sapience");
}

startAmqp();

const onBlock = ({
  header,
  started,
  finished,
  size,
  height,
  txCount,
  transactions,
  startDate,
}) => {
  const txs = transactions.map((tx) => tx.getTxid())
  const headerHash = header.getHash()
  
    amqp.publish(
        "sapience",
        "bsv.spv.block",
        Buffer.from(
            JSON.stringify({
                header: headerHash,
                started,
                finished,
                size,
                height,
                txCount,
                txs,
                startDate,
            })
    ))
  /* for (const [index, tx, pos, len] of transactions) {
    console.log(`#${index} tx ${tx.getTxid()} in block ${height}`);
  } */
};

listener.on("mempool_tx", ({ transaction, size }) => {
  /* console.log(
    `new mempool tx ${transaction.getTxid()} ${size.toLocaleString(
      "en-US"
    )} bytes.`
  ); */
  const txhex = transaction.toHex()
  const txid = transaction.getTxid()
    amqp.publish(
      "sapience",
      "bsv.spv.mempool",
      Buffer.from(
          JSON.stringify({ txhex, txid, size })
      )
    )
});
listener.on("block_reorg", ({ height, hash }) => {
  // Re-org after height
    amqp.publish(
          "sapience",
          "bsv.spv.reorg",
          Buffer.from(
              JSON.stringify({ height, hash })
          )
      )
});
listener.on("block_saved", ({ height, hash }) => {
  listener.syncBlocks(onBlock);
});

listener.syncBlocks(onBlock);
listener.connect({ port });