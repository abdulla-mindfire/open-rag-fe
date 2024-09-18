"use client";

import Head from "next/head";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import Loader from "./component/Loader";
import { VECTOR_DB } from "./utils";

export default function Home() {
  const API_BASE = process.env.NEXT_PUBLIC_APIENDPOINTS;
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(""); // For showing upload status
  const [generatedCollection, setGeneratedCollection] = useState("");
  const [pasteCollection, setPasetCollection] = useState("");
  const [vectorDb, setVectorDb] = useState("");
  const [modelList, setModelList] = useState([])
  const [model, setModel] = useState("")
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [searchResults, setSearchResults] = useState("")
  const [chatReady, setChatReady] = useState(false);
  const [fullUrl, setFullUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const collectionRef = useRef(null)
  const latestChatRef = useRef(null);

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  useEffect(() => {
    // Auto-scroll to the latest chat message
    if (latestChatRef.current) {
      latestChatRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);  

  useEffect(() => {
    fetchModelList()
  }, []);


  const fetchModelList = async() => {
    try {
      const response = await fetch(`${API_BASE}/llm-options`, {
        method: "GET"
      });
      const results = await response.json();
      if (response.ok) {
       setModelList(results)
      }
    setLoading(false)
    } catch (error) {
      setLoading(false)
      console.error("Error fetching model:", error);
      
    }
  }


  const handleFileChange = async (event) => {
    console.log("called", vectorDb, model)
    if(vectorDb === ""){
      alert("Please choose any vectordb")
      event.target.value = null;
      return
    }
    if(model === ""){
      alert("Please choose a model")
      event.target.value = null;
      return
    }
    const file = event.target.files[0];
    setSelectedFile(file);

    event.target.value = null;

    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("model_name", model);
      formData.append("vector_db_name", vectorDb);

      try {
        setLoading(true)
        const response = await fetch(`${API_BASE}/upload`, {
          method: "POST",
          body: formData,
        });
        const results = await response.json();
        if (response.ok) {
          setUploadStatus("File uploaded successfully");
          setGeneratedCollection(results?.collection_name);
          setPasetCollection("")
          setChatReady(true);
        } else {
          setUploadStatus("File upload failed");
        }
      setLoading(false)
      } catch (error) {
        setLoading(false)
        console.error("Error uploading file:", error);
        setUploadStatus("File upload failed");
      }
    }
  };

  const handleCollection = async (e) => {
    e.preventDefault();
    if(vectorDb === ""){
      alert("Please choose any vectordb")
      return
    }
    if(model === ""){
      alert("Please choose a model")
      return
    }
    try {
      setLoading(true)
      const response = await fetch(
        `${API_BASE}/check-collection?collection_name=${pasteCollection || collectionRef.current}&vector_db_name=${vectorDb}`,
        {
          method: "GET",
        }
      );

      const results = await response.json();
      if (response.ok) {
        console.log(results);
        setChatReady(true);
      }
      setLoading(false)
    } catch (error) {
      setLoading(false)
      console.error("Error uploading file:", error);
      alert("Collection is invalid");
    }
  };

  const handleStartChat = async (e) => {
    e.preventDefault();
    if (generatedCollection || pasteCollection) {
      if(vectorDb === ""){
        alert("Please choose any vectordb")
        return
      }
      if(model === ""){
        alert("Please choose a model")
        return
      }
      try {
        setLoading(true)
        const response = await fetch(`${API_BASE}/chat?collection_name=${generatedCollection || pasteCollection}&query=${query}&model_name=${model}&vector_db_name=${vectorDb}`, {
          method: "POST"
        });

        
        const results = await response.text();
        if (response.ok) {
          setQuery("");
          setChatHistory((prevChatHistory) => [
            ...prevChatHistory,
            { query: query, response: results?.response },
          ]);
        }
        setLoading(false)
      } catch (error) {
        setLoading(false)
        console.error("Error chatting:", error);
      }
    } else {
      alert("Please upload a file or use existing collection!");
    }
  };

  return (
    <div className="min-h-screen flex">
      <Head>
        <title>Retrieval Augmented Generation</title>
      </Head>
      <div className="w-1/4 bg-gray-100 p-4">
        <form className="mb-4" onSubmit={handleCollection}>
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="collectionName"
          >
            Enter the collection name if the PDF is already uploaded.
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="collectionName"
            type="text"
            value={pasteCollection}
            onChange={(e) => setPasetCollection(e.target.value)}
            required
          />
        </form>
        <div className="mb-4">
        <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="collectionName"
          >
            Select Vector DB
          </label>
          <select
            value={vectorDb}
            onChange={(e) => setVectorDb(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"  
          > 
            <option>Choose DB</option>
            {VECTOR_DB.map((db, idx) => (
              <option key={idx} value={db.value}>
                {db.label}
              </option>
            ))}
          </select>
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="collectionName"
          >
            Select Model
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"  
          >
            <option>Choose Model</option>
            {modelList && modelList.map((md, idx) => (
              <option key={idx} value={md.Model}>
                {md.Model}
              </option>
            ))}
          </select>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Upload Your PDF
          </label>
          <div className="border-dashed border-2 border-gray-400 rounded-lg p-4 text-center">
            <input
              type="file"
              className="hidden"
              id="file-upload"
              onChange={handleFileChange}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-blue-600 hover:underline"
            >
              {selectedFile ? selectedFile.name : "Drag and drop file here"}
            </label>
            <p className="mt-2 text-gray-600">Limit 10MB per file • PDF</p>
            <label
              htmlFor="file-upload"
              className="inline-block mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
            >
              Browse files
            </label>
          </div>
        </div>
        {selectedFile && (
          <div className="mb-4">
            <div className="border p-2 rounded flex justify-between items-center">
              <span className="text-gray-700">{selectedFile.name}</span>
              <button
                className="text-red-500 font-bold"
                onClick={() => setSelectedFile(null)}
              >
                &times;
              </button>
              <p className="mt-2 text-sm">{uploadStatus}</p>
            </div>
          </div>
        )}
        {generatedCollection && (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Copy below collection name to use the same data later
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="text"
              value={generatedCollection}
              readOnly
            />
          </div>
        )}
      </div>

      {chatReady && (
        <div className="w-3/4 bg-white p-8 flex flex-col justify-between">
          <div
            className="flex-grow overflow-y-auto"
            style={{ maxHeight: "900px" }}
          >
            <h1 className="text-2xl font-bold mb-6">
              Retrieval Augmented Generation
            </h1>

            {chatHistory.length > 0 &&
              chatHistory.map((chat, idx) => (
                <div className="mb-6" key={idx} ref={idx === chatHistory.length - 1 ? latestChatRef : null}>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="bg-red-500 p-2 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-white"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 8a6 6 0 11-11.946-1.742 1 1 0 10-1.964-.36A8 8 0 1020 8h-2z"
                          clipRule="evenodd"
                        />
                        <path
                          fillRule="evenodd"
                          d="M10 3a1 1 0 011 1v3h3a1 1 0 110 2H9a1 1 0 01-1-1V4a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <p className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                      {chat?.query}
                    </p>
                  </div>
                  <div className="bg-yellow-100 p-4 rounded-lg">
                    <ReactMarkdown>{chat?.response}</ReactMarkdown>
                  </div>
                  {chatHistory.length - 1 === idx && <div className="mb-2">
                    <button
                      onClick={handleModalToggle}
                      className="inline-block mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
                    >Show KB Inputs</button>
                  </div>}
                </div>
              ))}
          </div>

          <div className="mt-auto">
            {loading ? <Loader size="medium" color="black" /> : 
              <form className="flex" onSubmit={handleStartChat}>
              <input
                value={query}
                type="text"
                required
                placeholder="How may I help you?"
                onChange={(e) => setQuery(e.target.value)}
                className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <button
                type="submit"
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-r"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M2.94 6.94a1 1 0 000 1.42l7.07 7.07a1 1 0 001.42 0l7.07-7.07a1 1 0 00-1.42-1.42L10 13.59 4.36 7.94a1 1 0 00-1.42 0z" />
                </svg>
              </button>
            </form>}
          </div>
        </div>
      )}
    </div>
  );
}
