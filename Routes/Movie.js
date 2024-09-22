const express = require('express');
const router = express.Router();


const User = require('../Models/UserSchema')
const Movie = require('../Models/MovieSchema')
const Booking = require('../Models/BookingSchema')
const Screen = require('../Models/ScreenSchema')


const errorHandler = require('../Middlewares/errorMiddleware');
const authTokenHandler = require('../Middlewares/checkAuthToken');
const adminTokenHandler = require('../Middlewares/checkAdminToken');


function createResponse(ok, message, data) {
    return {
        ok,
        message,
        data,
    };
}

router.get('/test', async (req, res) => {
    res.json({
        message: "Movie api is working"
    })
})


// admin access
router.post('/createmovie', adminTokenHandler, async (req, res, next) => {
    try {
        const { title, description, portraitImgUrl, landscapeImgUrl, rating, genre, duration } = req.body;

        const newMovie = new Movie({ title, description, portraitImgUrl, landscapeImgUrl, rating, genre, duration })
        await newMovie.save();
        res.status(201).json({
            ok: true,
            message: "Movie added successfully"
        });
    }
    catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
})
router.post('/addcelebtomovie', adminTokenHandler, async (req, res, next) => {
    try {
        const { movieId, celebType, celebName, celebRole, celebImage } = req.body;
        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({
                ok: false,
                message: "Movie not found"
            });
        }
        const newCeleb = {
            celebType,
            celebName,
            celebRole,
            celebImage
        };
        if (celebType === "cast") {
            movie.cast.push(newCeleb);
        } else {
            movie.crew.push(newCeleb);
        }
        await movie.save();

        res.status(201).json({
            ok: true,
            message: "Celeb added successfully"
        });
    }
    catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
})
router.post('/createscreen', adminTokenHandler, async (req, res, next) => {
    try {
        const { name, location, seats, city, screenType } = req.body;
        const newScreen = new Screen({
            name,
            location, // Ensure this is being set correctly
            seats,
            city: city.toLowerCase(),
            screenType,
            movieSchedules: []
        });

        await newScreen.save();

        res.status(201).json({
            ok: true,
            message: "Screen added successfully"
        });
    }
    catch (err) {
        console.log(err);
        next(err); // Pass any errors to the error handling middleware
    }
});

router.post('/addmoviescheduletoscreen', adminTokenHandler, async (req, res, next) => {
    //console.log("Inside addmoviescheduletoscreen")
    try {
        const { screenId, movieId, showTime, showDate } = req.body;
        const screen = await Screen.findById(screenId);
        if (!screen) {
            return res.status(404).json({
                ok: false,
                message: "Screen not found"
            });
        }

        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({
                ok: false,
                message: "Movie not found"
            });
        }

        screen.movieSchedules.push({
            movieId,
            showTime,
            notavailableseats: [],
            showDate
        });

        await screen.save();

        res.status(201).json({
            ok: true,
            message: "Movie schedule added successfully"
        });

    }
    catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
})


// user access
router.post('/bookticket', authTokenHandler, async (req, res, next) => {
    try {
        const { showTime, showDate, movieId, screenId, seats, totalPrice, paymentId, paymentType } = req.body;
        console.log(req.body);

        const screen = await Screen.findById(screenId);
        if (!screen) {
            return res.status(404).json({
                ok: false,
                message: "Theatre not found"
            });
        }

        const movieSchedule = screen.movieSchedules.find(schedule => {
            const showDate1 = new Date(schedule.showDate);
            const showDate2 = new Date(showDate);

            const datesMatch = showDate1.getDate() === showDate2.getDate() &&
                               showDate1.getMonth() === showDate2.getMonth() &&
                               showDate1.getFullYear() === showDate2.getFullYear();

             const movieIdsMatch = schedule.movieId.equals(movieId); // Use equals for ObjectId comparison

            // return datesMatch && movieIdsMatch && schedule.showTime === showTime;

            // return showDate1.toDateString() === showDate2.toDateString() &&
            // schedule.showTime === showTime &&
            // schedule.movieId.toString() === movieId; 
        });

        if (!movieSchedule) {
            return res.status(404).json({
                ok: false,
                message: "Movie schedule not found"
            });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({
                ok: false,
                message: "User not found"
            });
        }

        const newBooking = new Booking({
            userId: req.userId,
            showTime,
            showDate,
            movieId,
            screenId,
            seats,
            totalPrice,
            paymentId,
            paymentType
        });
        await newBooking.save();

        movieSchedule.notAvailableSeats.push(...seats);
        await screen.save();

        user.bookings.push(newBooking._id);
        await user.save();

        res.status(201).json({
            ok: true,
            message: "Booking successful"
        });

    } catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
});





router.get('/movies', async (req, res, next) => {
    try {
        const movies = await Movie.find();

        // Return the list of movies as JSON response
        res.status(200).json({
            ok: true,
            data: movies,
            message: 'Movies retrieved successfully'
        });
    }
    catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
})
router.get('/movies/:id', async (req, res, next) => {
    try {
        const movieId = req.params.id;
        const movie = await Movie.findById(movieId);
        if (!movie) {
            // If the movie is not found, return a 404 Not Found response
            return res.status(404).json({
                ok: false,
                message: 'Movie not found'
            });
        }

        res.status(200).json({
            ok: true,
            data: movie,
            message: 'Movie retrieved successfully'
        });
    }
    catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
})
router.get('/screensbycity/:city', async (req, res, next) => {
    const city = req.params.city.toLowerCase();

    try {
        const screens = await Screen.find({ city });
        if (!screens || screens.length === 0) {
            return res.status(404).json(createResponse(false, 'No screens found in the specified city', null));
        }

        res.status(200).json(createResponse(true, 'Screens retrieved successfully', screens));
    }
    catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
});
router.get('/screensbymovieschedule/:city/:date/:movieid', async (req, res, next) => {
    try {
        const city = req.params.city.toLowerCase();
        const date = req.params.date;
        const movieId = req.params.movieid;

        // Retrieve screens for the specified city
        const screens = await Screen.find({ city });

        // Check if screens were found
        if (!screens || screens.length === 0) {
            return res.status(404).json(createResponse(false, 'No screens found in the specified city', null));
        }

        // Filter screens based on the movieId
        // const filteredScreens = screens.filter(screen =>
        //     screen.movieSchedules.some(schedule => schedule.movieId == movieId)
        // );


        let temp = []
        // Filter screens based on the showDate
        const filteredScreens = screens.forEach(screen => {
            // screen 

            screen.movieSchedules.forEach(schedule => {
                let showDate = new Date(schedule.showDate);
                let bodyDate = new Date(date);
                // console.log(showDate , bodyDate);
                if (showDate.getDay() === bodyDate.getDay() &&
                    showDate.getMonth() === bodyDate.getMonth() &&
                    showDate.getFullYear() === bodyDate.getFullYear() &&
                    schedule.movieId == movieId) {
                    temp.push(
                        screen
                    );
                }
            })
        }
        );

        console.log(temp);

        res.status(200).json(createResponse(true, 'Screens retrieved successfully', temp));

    } catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
});

router.get('/schedulebymovie/:screenid/:date/:movieid', async (req, res, next) => {
    const screenId = req.params.screenid;
    const date = req.params.date;
    const movieId = req.params.movieid;

    const screen = await Screen.findById(screenId);

    if (!screen) {
        return res.status(404).json(createResponse(false, 'Screen not found', null));
    }

    const movieSchedules = screen.movieSchedules.filter(schedule => {
        let showDate = new Date(schedule.showDate);
        let bodyDate = new Date(date);
        if (showDate.getDay() === bodyDate.getDay() &&
            showDate.getMonth() === bodyDate.getMonth() &&
            showDate.getFullYear() === bodyDate.getFullYear() &&
            schedule.movieId == movieId) {
            return true;
        }
        return false;
    });

    if (!movieSchedules) {
        return res.status(404).json(createResponse(false, 'Movie schedule not found', null));
    }

    res.status(200).json(createResponse(true, 'Movie schedule retrieved successfully', {
        screen, // Ensure this includes the location
        movieSchedulesforDate: movieSchedules
    }));
});



router.get('/getuserbookings' , authTokenHandler , async (req , res , next) => {
    try {
        const user = await User.findById(req.userId).populate('bookings');
        if(!user){
            return res.status(404).json(createResponse(false, 'User not found', null));
        }

        let bookings = [];
        // user.bookings.forEach(async booking => {
        //     let bookingobj = await Booking.findById(booking._id);
        //     bookings.push(bookingobj);
        // })

        for(let i = 0 ; i < user.bookings.length ; i++){
            let bookingobj = await Booking.findById(user.bookings[i]._id);
            bookings.push(bookingobj);
        }

        res.status(200).json(createResponse(true, 'User bookings retrieved successfully', bookings));
        // res.status(200).json(createResponse(true, 'User bookings retrieved successfully', user.bookings));
    } catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
})

router.get('/getuserbookings/:id' , authTokenHandler , async (req , res , next) => {
    try {
        const bookingId = req.params.id;
        const booking = await Booking.findById(bookingId);

        if(!booking){
            return res.status(404).json(createResponse(false, 'Booking not found', null));
        }

        res.status(200).json(createResponse(true, 'Booking retrieved successfully', booking));
    } catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
})



router.use(errorHandler)

module.exports = router;