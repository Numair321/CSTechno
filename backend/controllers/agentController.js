import Agent from "../models/Agent.js";
import bcrypt from "bcryptjs";

export const addAgent = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    // Validate required fields
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        message: "Please provide all required fields: name, email, mobile, and password"
      });
    }

    // Check if email is already in use
    const existingAgent = await Agent.findOne({ email });
    if (existingAgent) {
      return res.status(400).json({
        message: "An agent with this email already exists"
      });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create and save new agent
    const agent = new Agent({ 
      name, 
      email, 
      mobile, 
      password: hashed 
    });

    const savedAgent = await agent.save();
    console.log('New agent created:', savedAgent._id);

    // Return success without password
    const { password: _, ...agentWithoutPassword } = savedAgent.toObject();
    res.status(201).json({ 
      message: "Agent added successfully",
      agent: agentWithoutPassword
    });

  } catch (error) {
    console.error('Error adding agent:', error);
    res.status(500).json({ 
      message: "Failed to add agent",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getAgents = async (req, res) => {
  try {
    console.log('Fetching agents...');
    const agents = await Agent.find().lean().exec();
    
    if (!agents) {
      console.log('No agents found, returning empty array');
      return res.json([]);
    }
    
    console.log(`Found ${agents.length} agents`);
    res.json(Array.isArray(agents) ? agents : []);
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ 
      message: "Failed to fetch agents",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
