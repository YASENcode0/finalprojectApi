/// find all jobs by all ids array

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const app = express();
const PORT = process.env.PORT || 5000;
const DataBaseUrl = process.env.DATABASE_URL;
const JobPost = require("./Models/Job");
const newUser = require("./Models/User");
const JobUser = require("./Models/JobUsers");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const User = require("./Models/User");
const { ObjectId } = require("mongodb");
const JobUsers = require("./Models/JobUsers");
const { v4: RandPass } = require("uuid");

app.use(express.json({ limit: "200mb" }));
app.use(cors());

mongoose
  .connect(DataBaseUrl)
  .then(
    app.listen(PORT, () => {
      console.log("listening on port ", PORT);
    })
  )
  .catch((err) => {
    console.log("err listening ", err);
  });

//get all jobs
app.get("/all/jobs", async (req, res) => {
  try {
    await JobPost.find().then((response) => {
      res.json({ response });
    });
  } catch (err) {
    console.log("err get all jobs " + err);
    res.json({ err }).status(500);
  }
});

//get all jobs
app.get("/all/users", async (req, res) => {
  try {
    await User.find().then((response) => {
      res.json({ response });
    });
  } catch (err) {
    console.log("err get all users " + err);
    res.json({ err }).status(500);
  }
});

//add new job
app.post("/add/job", async (req, res) => {
  const { id, user, title, content, category, salary, location, photo, type } =
    req.body;
  try {
    const newJob = new JobPost();
    newJob.id = id;
    newJob.user = user;
    newJob.title = title;
    newJob.content = content;
    newJob.category = category;
    newJob.salary = salary;
    newJob.photo = photo;
    newJob.location = location;
    newJob.type = type;
    newJob.likes = 0;

    await newJob.save();
    res.json(newJob);
  } catch (err) {
    console.log("err add jobs " + err);
    res.json({ err }).status(500);
  }
});

app.post("/user/jobs", async (req, res) => {
  try {
    const { _id } = req.body;
    console.log(req.body);
    await JobPost.find({ id: _id }).then((response) => {
      res.json(response);
    });
  } catch (err) {
    console.log("err get user jobs " + err);
    res.json({ err }).status(500);
  }
});

//edit job
app.put("/edit/job", async (req, res) => {
  const { _id, id, title, content, category, salary, location, type } =
    req.body;

  try {
    await JobPost.findOne({ id: id }).then(async (response) => {
      console.log(response);
      if (response) {
        response.title = title;
        response.content = content;
        response.category = category;
        response.salary = salary;
        response.location = location;
        response.type = type;

        await response.save();
        res.send(response);
        console.log(response);
      } else {
        res.json({ msg: "the post not found!" });
        console.log("the post not found!");
      }
    });
  } catch (err) {
    console.log("err add jobs " + err);
    res.json({ err }).status(500);
  }
});

//add new user
app.post("/add/user", async (req, res) => {
  try {
    const { _id, name, email, password, city, isEmployee, profileImg, file } =
      req.body;

    newUser.findOne({ email }).then(async (response) => {
      if (!response) {
        const user = newUser();

        user._id = _id;
        user.name = name;
        user.email = email;
        user.password = req.body.google
          ? RandPass()
          : bcrypt.hashSync(password, 10);

        user.city = city;
        user.isEmployee = isEmployee;
        user.date = Date.now();
        user.postSave = [];
        user.profileImg = profileImg;
        user.file = file;

        await user.save();
        res.json({ msg: "", pass: true, user });
      } else {
        res.json({ msg: "email or password err", pass: false });
      }
    });
  } catch (err) {
    console.log("err add new user " + err);
    res.json({ err }).status(500);
  }
});

//log in
app.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);
    newUser.findOne({ email }).then((response) => {
      if (response) {
        if (req.body.google) {
          res.json({ msg: "", pass: true, user: response });
        } else {
          if (bcrypt.compareSync(password, response.password)) {
            res.json({ msg: "", pass: true, user: response });
          } else res.send({ msg: "password err", pass: false });
        }
      } else {
        res.send({ msg: "email or password err", pass: false });
      }
    });
  } catch (err) {
    console.log("err login " + err);
    res.json({ err }).status(500);
  }
});

// delete job
app.delete("/delete/job/:_id", async (req, res) => {
  try {
    const id = req.params._id;

    await JobPost.deleteOne({ _id: id }).then((response) => {
      if (response.deletedCount == 0) {
        res.json({ msg: "err delete job" });
      } else {
        res.json({ mag: "job deleted" });
      }
    });
  } catch (err) {
    console.log("err delete jobs " + err);
    res.json({ err }).status(500);
  }
});

// save job
app.put("/save/job", async (req, res) => {
  try {
    const { jobID, _id } = req.body;
    console.log(req.body);

    let saved = true;
    const user = await User.findOne({ _id });
    const userSavedPosts = user.postSave;

    if (
      !userSavedPosts.find((postId) => {
        return postId === jobID;
      })
    ) {
      userSavedPosts.push(jobID);
      addLike(jobID, true);
    } else {
      saved = false;
      removeElement(userSavedPosts, jobID);
      addLike(jobID, false);
    }
    await user.save();
    res.json({ user, saved });
  } catch (err) {
    console.log("err save job " + err);
    res.json({ err }).status(500);
  }
});

// get saved jobs
app.post("/get/saved/jobs", async (req, res) => {
  try {
    const { _id } = req.body;

    console.log(_id);

    await User.findOne({ _id }).then(async (response) => {
      if (response) {
        res.json(response.postSave);
      } else {
        res.json({ msg: "post not found" });
      }
    });
  } catch (err) {
    console.log("err get all jobs " + err);
    res.json({ err }).status(500);
  }
});

// sort by type & location
app.post("/get/sort", async (req, res) => {
  try {
    const { type, location } = req.body;
    console.log(type, location);
    if (type && location) {
      await JobPost.find({ type: type, location: location }).then(
        (response) => {
          // console.log(response)
          res.json(response);
          console.log("1");
        }
      );
    } else if (type) {
      await JobPost.find({ type }).then((response) => {
        // console.log(response)
        res.json(response);
        console.log("2");
      });
    } else if (location) {
      await JobPost.find({ location }).then((response) => {
        // console.log(response)
        res.json(response);
        console.log("3");
      });
    } else {
      await JobPost.find().then((response) => {
        // console.log(response)
        res.json(response);
        console.log("4");
      });
    }
    // console.log(req.body)
  } catch (err) {
    console.log("err get sort jobs " + err);
    res.json({ err }).status(500);
  }
});

//get job by id
app.post("/get/all/saved/jobs", async (req, res) => {
  try {
    const { _id } = req.body;
    if (!_id) {
      return res.status(400).json({ msg: "User ID is required" });
    }

    const user = await User.findOne({ _id });
    if (!user) {
      return res.json({ msg: "No user saved jobs" });
    }

    const savedJobs = user.postSave || [];
    if (savedJobs.length === 0) {
      console.log("No jobs found");
      return res.json([]);
    }
    const jobsIds = savedJobs.map((post) => new ObjectId(post));
    console.log(jobsIds);
    try {
      const allSavedPosts = await JobPost.find({ _id: { $in: jobsIds } });
      res.json(allSavedPosts);
    } catch (err) {
      console.error("Error fetching saved jobs: ", err);
      res.status(500).json({ msg: "Error fetching saved jobs" });
    }
  } catch (err) {
    console.error("Error getting all saved jobs: ", err);
    res.status(500).json({ err });
  }
});

app.post("/pdf", async (req, res) => {
  try {
    const { file } = req.body;
    // console.log(file);
    const user = await User.findOne({ _id: "1720369601659ales" });
    console.log(user);
    user.file = file;
    await user.save();
    res.json(user);
  } catch (err) {
    console.log("err get all jobs " + err);
    res.json({ err }).status(500);
  }
});

app.post("/get/user/resume", async (req, res) => {
  try {
    const { userId } = req.body;
    console.log(userId, "user id");
    const resume = await User.findOne({ _id: userId });
    if (resume) {
      res.json({ resume: resume.file });
    } else {
      console.log("user not found");
      res.json({ resume: null });
    }
    /////find the resume
  } catch (err) {
    console.log("err get user resume " + err);
    res.json({ err }).status(500);
  }
});

app.post("/get/post", async (req, res) => {
  try {
    const { postId } = req.body;

    const post = await JobPost.findOne({ _id: postId });
    if (post) {
      res.json(post);
    } else {
      console.log("post not found");
      res.send("post not found");
    }
    /////find the resume
  } catch (err) {
    console.log("err get post " + err);
    res.json({ err }).status(500);
  }
});

app.put("/change/user", async (req, res) => {
  try {
    const { userId, name, password, city, isEmployee, profileImg, file } =
      req.body;

    await User.findOne({ _id: userId }).then(async (user) => {
      user.name = name;
      if (password) user.password = bcrypt.hashSync(password, 10);
      user.city = city;
      user.isEmployee = isEmployee;
      user.profileImg = profileImg;
      user.file = file;

      await user.save();
      console.log(user);
      res.json(user);
    });
  } catch (err) {
    console.log("err change user " + err);
    res.json({ err }).status(500);
  }
});

// jobs user store

app.post("/job/submit", async (req, res) => {
  try {
    const { postId, userId } = req.body;

    const isSubmit = await JobUser.find({ postId, userId });

    if (!isSubmit.length) {
      postUser = new JobUser();
      postUser.postId = postId;
      postUser.userId = userId;
      await postUser.save();
    }
    res.send("submit successfully");
  } catch (err) {
    console.log("err submit jobs " + err);
    res.json({ err }).status(500);
  }
});

app.post("/job/get/submit", async (req, res) => {
  try {
    const { postId } = req.body;

    await JobUser.find({ postId })
      .populate("userId")
      .then((response) => {
        if (response) {
          console.log(response);
          res.json(response);
        } else {
          res.json({ msg: "user not found" });
        }
      });
  } catch (err) {
    console.log("err get submit" + err);
    res.json({ err }).status(500);
  }
});

app.post("/get/subUser", async (req, res) => {
  try {
    const { postId } = req.body;
    const data = await JobUsers.aggregate([
      {
        $match: {
          postId: postId, // تصفية المستخدم بناءً على id كحقل نصي
        },
      },
      {
        $lookup: {
          from: "users", // اسم المجموعة الثانية
          localField: "id", // الحقل في مجموعة User (يجب أن يتطابق مع userId في jobusers)
          foreignField: "userId", // الحقل في مجموعة jobusers
          as: "JobUsersSub", // الاسم الذي سيتم استخدامه لتخزين البيانات المدمجة
        },
      },
    ]);

    res.json(data);
  } catch (err) {
    console.log("err get user " + err);
    res.json({ err }).status(500);
  }
});

app.post("/send/message", async (req, res) => {
  try {
    const { to, from, content } = req.body;
    console.log(to, from, content);
    const userMessages = await User.findOne({ _id: to });
    console.log(userMessages);
    if (userMessages) {
      userMessages.messages.push({
        from,
        content,
        seen: false,
      });
      await userMessages.save();
      res.json(userMessages);
    } else {
      res.send("user not found");
    }
  } catch {
    console.log("err send message " + err);
    res.json({ err }).status(500);
  }
});

app.post("/get/messages", async (req, res) => {
  // دالة لجلب اسم المستخدم بناءً على المعرف
  async function getUserName(id) {
    const user = await User.findOne({ _id: id });
    return user ? user.name : null; // التأكد من وجود المستخدم
  }

  try {
    const { userId } = req.body;

    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const Messages = user.messages;

    // استخدام Promise.all للتأكد من انتظار جميع النتائج المتزامنة
    const allMessages = await Promise.all(
      Messages.map(async (item) => {
        // جلب اسم الشخص بناءً على معرف from
        const fromUserName = await getUserName(item.from);
        return { ...item._doc, from: fromUserName }; // نسخ باقي خصائص الرسالة وتعديل from
      })
    );

    res.json({ Messages: allMessages });
  } catch (err) {
    console.log("Error getting messages: " + err);
    res.status(500).json({ err });
  }
});

// app.get('/jobs',(req,res)=>{
//     try{

//     }catch(err){
//         console.log('err get all jobs '+err)
//         res.json({err}).status(500)
//     }
// })

// admin methods

app.post("/block/user", async (req, res) => {
  const { userId, adminCode } = req.body;
  if (adminCode == process.env.ADMIN_CODE) {
    await User.findOne({ _id: userId }).then(async (response) => {
      if (response) {
        response.blocked = !response.blocked;
        await response.save();
        res.json({ msg: "yser are blocked" });
      }
    });
  } else {
    console.log("adminCode wrong" + err);
    res.json({ err }).status(400);
  }
});

function removeElement(arr, value) {
  while (true) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] == value) {
        arr.splice(i, 1);
        break;
      }
    }
    if (
      !arr.find((num) => {
        return num == value;
      })
    ) {
      return;
    }
  }
}
async function addLike(postId, type) {
  try {
    const postLikes = await JobPost.findOne({ _id: postId });
    if (postLikes) {
      if (type) {
        postLikes.likes = postLikes.likes + 1;
      } else {
        postLikes.likes = postLikes.likes - 1;
      }
      await postLikes.save();
    } else {
      console.log("Post not found");
    }
    console.log("post like ", postLikes);
  } catch (err) {
    console.log("err add like : ", err);
  }
}
