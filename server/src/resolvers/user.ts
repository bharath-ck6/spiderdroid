import argon2 from "argon2";
import { randomUUID } from "crypto";
import { Post } from "../entities/Post";
import { MyContext } from "../types";
import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import { User } from "../entities/User";
import { validateRegister } from "../utils/validateRegister";
import { UsernamePasswordRegistrationInput } from "./usernamePasswordRegistrationInput";
import { Payment } from "../entities/Payment";
import { Bookings } from "../entities/Bookings";
import { _COOKIE_NAME, _FORGOT_PASSWORD_PREFIX } from "../constants";
import { v4 } from "uuid";
import { sendEmail } from "../utils/sendEmail";
import { MoreThan } from "typeorm";

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class PaymentStatus {
  @Field()
  status: boolean;
}

@ObjectType()
class RazorpayFields {
  @Field({ nullable: true })
  id: string;

  @Field({ nullable: true })
  entity: string;

  @Field({ nullable: true })
  amount: number;

  @Field({ nullable: true })
  // eslint-disable-next-line camelcase
  amount_paid: number;

  @Field({ nullable: true })
  // eslint-disable-next-line camelcase
  amount_due: number;

  @Field({ nullable: true })
  currency: string;

  @Field({ nullable: true })
  receipt: string;

  @Field({ nullable: true })
  // eslint-disable-next-line camelcase
  offer_id: string;

  @Field({ nullable: true })
  status: string;

  @Field({ nullable: true })
  attempts: number;

  // @Field({ nullable: true })
  // notes: string[];

  @Field({ nullable: true })
  // eslint-disable-next-line camelcase
  created_at: number;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@ObjectType()
class RazorpayResponse {
  @Field(() => String, { nullable: true })
  errors?: string;

  @Field(() => RazorpayFields, { nullable: true })
  paymentResponse?: RazorpayFields;
}

@Resolver(User)
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: MyContext): Promise<User | undefined> {
    // Not logged in
    if (!req.session.userId) {
      return undefined;
    }
    console.log("User ID *************************** ", req.session.userId);
    return await User.findOne(req.session.userId, {
      relations: ["bookings", "bookings.comment", "posts"],
    });
  }

  @Mutation(() => UserResponse, { nullable: true })
  async register(
    @Arg("options") options: UsernamePasswordRegistrationInput,
    @Ctx() { req }: MyContext,
  ): Promise<UserResponse> {
    const errors = validateRegister(options);

    if (errors) {
      return { errors };
    }

    // Hash the password before storing in the DB
    const hashedPassword = await argon2.hash(options.password);
    let user;
    try {
      user = await User.create({
        username: options.username,
        password: hashedPassword,
        email: options.email,
      }).save();
    } catch (err) {
      console.log(err);
      if (err.code === "23505") {
        return {
          errors: [
            {
              field: "username",
              message: "username already exists.",
            },
          ],
        };
      }
    }

    if (user) {
      req.session.userId = user.id;
    }
    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("username") userNameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { req }: MyContext,
  ): Promise<UserResponse> {
    // Find if user is present in DB
    const user = await User.findOne(
      userNameOrEmail.includes("@")
        ? { where: { email: userNameOrEmail } }
        : { where: { username: userNameOrEmail } },
    );

    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: "user doesn't exist",
          },
        ],
      };
    }

    const verifiedPassword = await argon2.verify(user?.password, password);

    if (!verifiedPassword) {
      return {
        errors: [
          {
            field: "password",
            message: "password is incorrect.",
          },
        ],
      };
    }

    //Set the session
    req.session.userId = user.id;

    return {
      user,
    };
  }

  @Mutation(() => RazorpayResponse)
  async razorpaypayment(
    @Arg("id") carId: number,
    @Arg("userFromDate") userFromDate: Date,
    @Arg("userToDate") userToDate: Date,
    @Ctx() { razorpay, req }: MyContext,
  ): Promise<RazorpayResponse> {
    const car = await Post.findOne(carId);

    if (!car) {
      return { errors: "Car not found with the ID , please retry afer sometime !" };
    }

    const options = {
      amount: car.carCostPerDay * 100,
      currency: "INR",
      receipt: randomUUID(),
      payment_capture: 1,
    };

    let response: RazorpayFields;
    try {
      response = await razorpay.orders.create(options);
    } catch (err) {
      return { errors: err };
    }

    console.log(response);
    const currentUser = await User.findOne(req.session.userId);
    // Since response is returned , store it in DB [But not yet verified]
    Payment.create({
      amount: response.amount,
      amountDue: response.amount_due,
      amountPaid: response.amount_paid,
      attempts: response.attempts,
      offerId: response.offer_id,
      orderId: response.id,
      receipt: response.receipt,
      orderBy: currentUser,
      status: response.status,
    }).save();

    // Since payment started , add it to booking
    // But check if booking exists with same date and status is success

    const bookings = await Bookings.find({
      where: {
        carId: carId,
        fromDate: MoreThan(new Date().toISOString().slice(0, 19).replace("T", " ")),
      },
    });

    let bookingFound = [];
    bookingFound = bookings.map((booking) => {
      console.log("BOOKING FOUND --> ", booking);
      if (
        booking.fromDate.getDate() === userFromDate.getDate() &&
        booking.bookingStatus === "Success"
      ) {
        return true;
      } else {
        return false;
      }
    });

    if (bookingFound.length > 0 && bookingFound.includes(true)) {
      return { errors: "Cannot rent this car at the moment" };
    }

    Bookings.create({
      carId: carId,
      bookingStatus: "InProgress",
      orderId: response.id,
      ratingStatus: false,
      user: currentUser,
      fromDate: userFromDate,
      toDate: userToDate,
      post: await Post.findOne(carId),
    }).save();

    const user = await User.findOne(req.session.userId);
    if (user) {
      await sendEmail(user?.email, "", `${process.env.WEB_APP_URL}/profile`, true, user.username);
    }

    return { paymentResponse: response };
  }

  @Query(() => PaymentStatus)
  async paymentstatus(@Arg("orderId") orderId: string): Promise<PaymentStatus> {
    let paymentVerified = false;
    console.log("ORDER ID POLLING ::: ", orderId);
    const payment = await Payment.findOne({ where: { orderId: orderId } });
    if (payment?.verificationStatus) {
      console.log("VERIFICATION SUCCESSFUL : ", payment?.verificationStatus);
      paymentVerified = true;
    }
    return { status: paymentVerified };
  }

  @Mutation(() => Boolean)
  async forgotPassword(@Arg("email") email: string, @Ctx() { redis }: MyContext): Promise<boolean> {
    const user = await User.findOne({ where: { email: email } });
    if (!user) {
      console.log("User not found !!!");
      return true;
    }
    console.log("USER FOUND %%%%%%%%%%% : ", user.id);
    const token = v4();
    // set token to redis with 3 days to expiry
    const res = await redis.set(
      _FORGOT_PASSWORD_PREFIX + token,
      user.id,
      "ex",
      1000 * 60 * 60 * 60 * 24 * 3,
    );
    console.log("REDIS TOKEN  : ", _FORGOT_PASSWORD_PREFIX + token);
    console.log("REDIS TOKEN SET : ", res);

    console.log("Sending Email $$$$$$$$$ ");
    try {
      await sendEmail(email, `${process.env.WEB_APP_URL}/change-password/${token}`, "", false, "");
    } catch (error) {
      console.log("Error while sending mail : ", error);
    }
    console.log("Mail Successfully Sent ");
    return true;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") password: string,
    @Ctx() { redis, req }: MyContext,
  ): Promise<UserResponse> {
    console.log("Started*********");
    // validate new Password
    if (password.length <= 5) {
      console.log("^&&*^*&^*&%*&% : Password error");
      return {
        errors: [
          {
            field: "password",
            message: "Length must be atleast 5.",
          },
        ],
      };
    }

    // validate token
    const userToken = _FORGOT_PASSWORD_PREFIX + token;
    console.log("REDIS TOKEN CHECK  : ", userToken);
    const userId = await redis.get(userToken);
    console.log("GOT REDIS TOKEN : ", userId);
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "Oh snap! Looks like the link has expired, Please retry forgot password.",
          },
        ],
      };
    }

    const userid = parseInt(userId);
    const user = await User.findOne(userid);

    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "user no longer exists",
          },
        ],
      };
    }

    // Change the password
    await User.update({ id: userid }, { password: await argon2.hash(password) });

    // Login the user
    req.session.userId = user.id;

    await redis.del(userToken);

    return { user };
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { req, res }: MyContext): Promise<boolean> {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        if (err) {
          console.log(err);
          resolve(false);
          return false;
        }
        res.clearCookie(_COOKIE_NAME);
        resolve(true);
        return true;
      }),
    );
  }
}
