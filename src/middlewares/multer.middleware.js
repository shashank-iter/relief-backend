import multer from "multer";
// jane se pehle mujse milke jana

// we can store the file in temporary memory called memory storage, not recommended for large files

// or we can use the disk storage to store the file in the disk

// cb --> callback

// file --> it conatins the file

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp");
        console.log("file", file);
    },
    filename: function (req, file, cb) {
        // adding a unique suffix to the file name
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

        // building the file name so that in case of files with same name being uploaded it doesn't get replaced
        cb(null, file.fieldname + "-" + uniqueSuffix);
    },
});

export const upload = multer({ storage: storage });
