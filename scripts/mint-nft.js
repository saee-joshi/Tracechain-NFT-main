require("dotenv").config();
const express = require('express');
const date = require("date-and-time");
const app = new express();
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const bodyParser = require('body-parser');

const pinataSDK = require('@pinata/sdk');

const pinata = pinataSDK('dc7368dd86f9a9504c9a','d52468b7fe38364e943fa981b29ec53464087f60d9b70f75e4284f76d8bfe2a3');

const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const API_URL = process.env.API_URL;

const web3 = createAlchemyWeb3(API_URL);
const now = new Date();
const contract = require("../artifacts/contracts/MyNFT.sol/MyNFT.json");
//const contract = require("../artifacts/contracts/mynft.sol");

//console.log(JSON.stringify(contract.abi));

const contractAddress = "0xAf7e29267fA4c0906A196C93fc442fc6dF7E1895";
const nftContract = new web3.eth.Contract(contract.abi, contractAddress);

//app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

//create transaction


//API for Minting Url = localhost:/mintnft
app.post("/mintnft",async (req,res)=>{
  try {
    let rsp = {}
    const data = {
      "attributes": [
        {
          "color": req.body.color,
          "value": req.body.value
        }
      ],
      "description": req.body.description,
      "image": req.body.image,
      "name": req.body.name
    }
    console.log(data)
      
    //pinata api for uploading meta data on IPFS
    pinata.pinJSONToIPFS(data).then(async(result) => {
      let hsh = "https://gateway.pinata.cloud/ipfs/"+result.IpfsHash         
      const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, "latest"); //get latest nonce
      const pattern = date.compile("ddd, MMM DD YYYY");
      const datetime = date.format(now, pattern);

      //the transaction
      const tx = {
        from: PUBLIC_KEY,
        to: contractAddress,  
        nonce: nonce,
        gas: 500000,
        //data: nftContract.methods.mintNFT(PUBLIC_KEY,hsh,"red","5500","rollex_watch").encodeABI(),
       data: nftContract.methods.mintNFT(data.name,
        data.attributes[0].color,
        data.description,
        
        data.attributes[0].value,
        datetime,
        PUBLIC_KEY,
        PUBLIC_KEY,
        hsh).encodeABI(),
      };

    
      const signPromise = web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
                signPromise
                  .then((signedTx) => {
                    web3.eth.sendSignedTransaction(
                      signedTx.rawTransaction,
                      async function (err, hash) {
                        if (!err) {
                          console.log("The hash of your transaction is: ",hash);

                          const txDetails = await web3.eth.getTransaction(hash);
                          rsp["TxHash"] = hash
                          rsp["Ipfs Url"]= hsh
                          rsp["MetaData"]= data
                          rsp["Contract Address"]= txDetails.to

                          res.json(rsp)
                          res.end();
                        } else {
                          console.log("Something went wrong when submitting your transaction:",err);
                          return(err);
                        }
                      }
                    );
                    })
                  .catch((err) => {
                    console.log(" Promise failed:", err);
                  });
              });
      } catch (error) {
        res.write(404).send(error);
}
});

//API for TransferNFT Url = localhost:/transfernft
app.post("/transfernft", async (req, res) => {
  try {
    let rsp = {};
    const data = {
      to: req.body.to,
      tokenid: req.body.tokenid,
    };
    console.log(data);
    //create transaction
    const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, "latest"); //get latest nonce

    //the transaction
    const tx = {
      from: PUBLIC_KEY,
      to: contractAddress,
      nonce: nonce,
      gas: 500000,
      data: nftContract.methods
        .transferFrom(PUBLIC_KEY, data.to, data.tokenid)
        .encodeABI(),
    };

    //sign Transcation
    const signPromise = web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
    signPromise
      .then((signedTx) => {
        web3.eth.sendSignedTransaction(
          signedTx.rawTransaction,
          async function (err, hash) {
            if (!err) {
              console.log("The hash of your transaction is: ", hash);

              const txDetails = await web3.eth.getTransaction(hash);
              rsp["TxHash"] = hash;
              rsp["Input-Data"] = data;
              rsp["Contract Address"] = txDetails.to;

              res.json(rsp);
              res.end();
            } else {
              console.log(
                "Something went wrong when submitting your transaction:",
                err
              );
              return err;
            }
          }
        );
      })
      .catch((err) => {
        console.log(" Promise failed:", err);
      });
  } catch (err) {
    res.status(400).send(err);
  }
});

//serving on this port
app.listen(8000,()=>{
  console.log("Lisitng on Port 8000");
})



