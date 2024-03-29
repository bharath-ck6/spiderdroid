import { FormControl, FormHelperText, FormLabel } from "@chakra-ui/form-control";
import { Box, Flex, HStack, Stack, Text } from "@chakra-ui/layout";
import {
  Button,
  CheckboxGroup,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Radio,
  RadioGroup,
  Select,
  Spinner,
  Textarea,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import router from "next/router";
import React from "react";
import Upload from "../components/RentalComponents/fileuploadzone";
import Layout from "../components/IndexPageComponents/Layout";
import NavBar from "../components/IndexPageComponents/NavBar";
import { useViewport } from "../components/InteractiveComponents/ViewPortHook";
import { Wrapper } from "../components/IndexPageComponents/Wrapper";
import { useDestinationsQuery, useHostCarMutation } from "../generated/graphql";
import { withApolloClient } from "../utils/apollo-client";

const HostCar = () => {
  let [value, setValue] = React.useState("");
  let [imageURL, setImageURL] = React.useState([]);
  const { width } = useViewport();
  const breakpoint = 700;

  const { data } = useDestinationsQuery();

  const [hostCar, { loading, error }] = useHostCarMutation({
    notifyOnNetworkStatusChange: true,
  });

  let handleInputChange = (e) => {
    let inputValue = e.target.value;
    setValue(inputValue);
  };

  return (
    <>
      <Box backgroundImage="url('https://res.cloudinary.com/dhmtg163x/image/upload/v1631903194/confetti-doodles_ysjon8.svg')">
        <NavBar />
        <Layout variantType="regular">
          <Wrapper variant="regular">
            <Formik
              initialValues={{
                carmake: "",
                carmodel: "",
                caryear: "",
                description: "",
                transmission: "automatic",
                category: "daily",
                miles: "",
                mileage: "",
                doors: "",
                seats: "",
                mediaSystem: ["android auto", "apple carplay", ""],
                condition: "average",
                conditionDescription: "",
                petSituation: ["pet friendly"],
                fuelType: "electric",
                carvin: "",
                destination: "",
                isSubmitButton: false,
                carCostPerDay: "",
              }}
              onSubmit={async (values, { setErrors }) => {
                if (imageURL.length < 3) {
                  return null;
                }

                // Use hook function here.
                const response = await hostCar({
                  variables: {
                    options: {
                      Doors: parseInt(values.doors),
                      Mileage: parseInt(values.mileage),
                      Miles: parseInt(values.miles),
                      Seats: parseInt(values.seats),
                      Transmission: values.transmission,
                      carCondition: values.condition,
                      carMake: values.carmake,
                      carModel: values.carmodel,
                      carVin: values.carvin,
                      carYear: values.caryear,
                      category: values.category,
                      conditionDescription: values.conditionDescription,
                      description: values.description,
                      fuelType: values.fuelType,
                      imageUrl: imageURL,
                      mediaSystem: values.mediaSystem,
                      petSituation: values.petSituation,
                      destination: values.destination,
                      carCostPerDay: parseInt(values.carCostPerDay),
                    },
                  },
                });

                if (response.data.createPost) {
                  router.push("/");
                }
              }}
            >
              {({ isSubmitting }) => (
                <Form>
                  <Box boxShadow="xl" backgroundColor="whiteAlpha.800" borderRadius={10}>
                    <Box m={4} pb={10} pt={10}>
                      <Flex justifyContent="left">
                        <Field
                          name="carmake"
                          render={({ field }) => (
                            <FormControl as="fieldset" isRequired={true}>
                              <FormLabel as="legend">Car Brand</FormLabel>
                              <Input minW="60%" name="carmake" placeholder="Car Make" {...field} />
                              <FormHelperText>Company name</FormHelperText>
                            </FormControl>
                          )}
                        />

                        <Field
                          name="carmodel"
                          render={({ field }) => (
                            <FormControl as="fieldset" isRequired={true}>
                              <FormLabel as="legend">Car Model</FormLabel>
                              <Input
                                minW="60%"
                                name="carmodel"
                                placeholder="Car Model"
                                {...field}
                              />
                              <FormHelperText>Model name of the car</FormHelperText>
                            </FormControl>
                          )}
                        />

                        <Box>
                          <Field
                            name="caryear"
                            render={({ field }) => (
                              <FormControl id="caryear" isRequired={true}>
                                <FormLabel>Year</FormLabel>
                                <NumberInput max={new Date().getFullYear()} min={1800}>
                                  <NumberInputField minW="60%" {...field} />
                                  <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                  </NumberInputStepper>
                                </NumberInput>
                                <FormHelperText>Manufactured year of car</FormHelperText>
                              </FormControl>
                            )}
                          />
                        </Box>
                      </Flex>
                      <Flex alignItems="center">
                        <Box mt={4}>
                          <Field
                            name="carvin"
                            render={({ field }) => (
                              <FormControl as="fieldset" {...field} isRequired={true}>
                                <FormLabel as="legend">Car Vin</FormLabel>
                                <Input minW="100%" name="carvin" placeholder="Car Vin Number" />
                                <FormHelperText>VIN Number of the car</FormHelperText>
                              </FormControl>
                            )}
                          />
                        </Box>
                      </Flex>

                      <Box mt={4}>
                        <Field
                          name="carCostPerDay"
                          render={({ field }) => (
                            <FormControl id="carCostPerDay" isRequired={true}>
                              <FormLabel>Rental Cost / Day</FormLabel>
                              <NumberInput max={4000} min={800}>
                                <NumberInputField minW="100%" placeholder="0" {...field} />
                                <NumberInputStepper>
                                  <NumberIncrementStepper />
                                  <NumberDecrementStepper />
                                </NumberInputStepper>
                              </NumberInput>
                              <FormHelperText>
                                Set the price for the rental per day [See guidelines for more info.]
                              </FormHelperText>
                            </FormControl>
                          )}
                        />
                      </Box>

                      <Box mt="4">
                        {/* Description */}
                        <Field
                          name="description"
                          render={({ field }) => (
                            <FormControl as="fieldset" isRequired={true}>
                              <FormLabel as="legend">Description</FormLabel>
                              <Textarea
                                value={value}
                                onChange={handleInputChange}
                                placeholder="Here is a sample placeholder"
                                size="sm"
                                {...field}
                              />
                              <FormHelperText>
                                Write something that you want the customer to know
                              </FormHelperText>
                            </FormControl>
                          )}
                        />
                      </Box>

                      {/* Transmission */}
                      <Box mt={4}>
                        <Field
                          name="transmission"
                          render={({ field }) => (
                            <FormControl as="fieldset" isRequired={true}>
                              <FormLabel as="legend">Transmission</FormLabel>
                              <RadioGroup defaultValue="automatic" {...field}>
                                <HStack spacing="24px">
                                  <label>
                                    <Field
                                      {...field}
                                      type="radio"
                                      name="transmission"
                                      value="manual"
                                    />
                                    Manual
                                  </label>
                                  <label>
                                    <Field
                                      {...field}
                                      type="radio"
                                      name="transmission"
                                      value="automatic"
                                    />
                                    Automatic
                                  </label>
                                  <label>
                                    <Field
                                      {...field}
                                      type="radio"
                                      name="transmission"
                                      value="cvt"
                                    />
                                    CVT
                                  </label>
                                  <label>
                                    <Field
                                      {...field}
                                      type="radio"
                                      name="transmission"
                                      value="dct"
                                    />
                                    DCT
                                  </label>
                                </HStack>
                              </RadioGroup>
                              <FormHelperText>
                                This will help customer to choose the right car
                              </FormHelperText>
                            </FormControl>
                          )}
                        />
                      </Box>

                      {/* Category */}
                      <Box mt={4}>
                        <Field
                          name="category"
                          render={({ field }) => (
                            <FormControl as="fieldset" isRequired={true}>
                              <FormLabel as="legend">Category</FormLabel>
                              <RadioGroup defaultValue="daily" {...field}>
                                <HStack spacing="24px">
                                  <label>
                                    <Field {...field} type="radio" name="category" value="daily" />
                                    Daily
                                  </label>
                                  <label>
                                    <Field {...field} type="radio" name="category" value="luxury" />
                                    Luxury
                                  </label>
                                  <label>
                                    <Field {...field} type="radio" name="category" value="sport" />
                                    Sport
                                  </label>
                                  <label>
                                    <Field
                                      {...field}
                                      type="radio"
                                      name="category"
                                      value="limited"
                                    />
                                    Limited
                                  </label>
                                </HStack>
                              </RadioGroup>
                              <FormHelperText>
                                This will help customer to choose the right car
                              </FormHelperText>
                            </FormControl>
                          )}
                        />
                      </Box>

                      {/* Miles */}
                      <Box mt={4}>
                        <Box>
                          <Field
                            name="miles"
                            render={({ field }) => (
                              <FormControl id="carmiles" isRequired={true}>
                                <FormLabel>Miles</FormLabel>
                                <NumberInput max={15000} min={0}>
                                  <NumberInputField minW="100%" {...field} />
                                  <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                  </NumberInputStepper>
                                </NumberInput>
                              </FormControl>
                            )}
                          />
                        </Box>
                      </Box>

                      {/* Mileage */}
                      <Box mt={4}>
                        <Box>
                          <Field
                            name="mileage"
                            render={({ field }) => (
                              <FormControl id="carmileage" isRequired={true}>
                                <FormLabel>Approx. Mileage</FormLabel>
                                <NumberInput max={30} min={6}>
                                  <NumberInputField minW="100%" {...field} />
                                  <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                  </NumberInputStepper>
                                </NumberInput>
                              </FormControl>
                            )}
                          />
                        </Box>
                      </Box>

                      {/* Doors */}
                      <Flex justifyContent="left">
                        <Box mt={4}>
                          <Field
                            name="doors"
                            render={({ field }) => (
                              <FormControl id="cardoors" isRequired={true}>
                                <FormLabel>Doors</FormLabel>
                                <NumberInput max={4} min={2}>
                                  <NumberInputField {...field} />
                                  <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                  </NumberInputStepper>
                                </NumberInput>
                              </FormControl>
                            )}
                          />
                        </Box>

                        {/* Seats */}

                        <Box mt={4} ml={4}>
                          <Field
                            name="seats"
                            render={({ field }) => (
                              <FormControl id="carseats" isRequired={true}>
                                <FormLabel>Seats</FormLabel>
                                <NumberInput max={4} min={2} name="seats">
                                  <NumberInputField {...field} />
                                  <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                  </NumberInputStepper>
                                </NumberInput>
                              </FormControl>
                            )}
                          />
                        </Box>
                      </Flex>

                      {/* mediaSystem */}

                      <Box mt={4}>
                        <Field
                          name="mediaSystem"
                          render={({ field }) => (
                            <FormControl as="fieldset" isRequired={true}>
                              <FormLabel as="legend">Media System</FormLabel>
                              <CheckboxGroup
                                colorScheme="blue"
                                defaultValue={["android auto", "apple carplay", ""]}
                                {...field}
                              >
                                <HStack>
                                  <label>
                                    <Field
                                      {...field}
                                      type="checkbox"
                                      name="mediaSystem"
                                      value="aux"
                                    />
                                    Aux
                                  </label>
                                  <label>
                                    <Field
                                      {...field}
                                      type="checkbox"
                                      name="mediaSystem"
                                      value="android auto"
                                    />
                                    Android Auto
                                  </label>
                                  <label>
                                    <Field
                                      {...field}
                                      type="checkbox"
                                      name="mediaSystem"
                                      value="apple carplay"
                                    />
                                    Apple Carplay
                                  </label>
                                </HStack>
                              </CheckboxGroup>
                              <FormHelperText>
                                This will help customer to choose the right car
                              </FormHelperText>
                            </FormControl>
                          )}
                        />
                      </Box>

                      {/* Condition */}
                      <Box mt={4}>
                        <Flex>
                          <Field
                            name="condition"
                            render={({ field }) => (
                              <FormControl as="fieldset" isRequired={true}>
                                <FormLabel as="legend">Car Condition</FormLabel>
                                <RadioGroup defaultValue="average" {...field}>
                                  <HStack spacing="24px">
                                    <label>
                                      <Field
                                        {...field}
                                        type="radio"
                                        name="condition"
                                        value="near new"
                                      />
                                      Near New
                                    </label>
                                    <label>
                                      <Field
                                        {...field}
                                        type="radio"
                                        name="condition"
                                        value="extra clean"
                                      />
                                      Extra Clean
                                    </label>
                                    <label>
                                      <Field
                                        {...field}
                                        type="radio"
                                        name="condition"
                                        value="clean"
                                      />
                                      Clean
                                    </label>
                                    <label>
                                      <Field
                                        {...field}
                                        type="radio"
                                        name="condition"
                                        value="average"
                                      />
                                      Average
                                    </label>
                                    <label>
                                      <Field
                                        {...field}
                                        type="radio"
                                        name="condition"
                                        value="rough"
                                      />
                                      Rough
                                    </label>
                                  </HStack>
                                </RadioGroup>
                                <FormHelperText>
                                  This will help customer to choose the right car
                                </FormHelperText>
                              </FormControl>
                            )}
                          />
                        </Flex>
                      </Box>

                      {/* ConditionDescription */}
                      <Box mt={4}>
                        <Field
                          name="conditionDescription"
                          render={({ field }) => (
                            <FormControl id="carcondition" isRequired={true}>
                              <FormLabel>Describe the condition of car</FormLabel>
                              <Input {...field} type="text" name="conditionDescription" />
                              <FormHelperText>
                                This will help set the expectations for customer
                              </FormHelperText>
                            </FormControl>
                          )}
                        />
                      </Box>

                      {/* Pet Situation */}

                      <Box mt={4}>
                        <Field
                          name="petSituation"
                          render={({ field }) => (
                            <FormControl as="fieldset" isRequired={true}>
                              <FormLabel as="legend">Pet Situation</FormLabel>
                              <HStack spacing="24px">
                                <label>
                                  <Field
                                    {...field}
                                    type="checkbox"
                                    name="petSituation"
                                    value="pet friendly"
                                  />
                                  Pet Friendly
                                </label>
                              </HStack>
                              <FormHelperText>
                                This will help customer to choose the right car
                              </FormHelperText>
                            </FormControl>
                          )}
                        />
                      </Box>

                      {/* Fuel Type */}
                      <Box mt={4}>
                        <Field
                          name="fuelType"
                          render={({ field }) => (
                            <FormControl as="fieldset" isRequired={true}>
                              <FormLabel as="legend">Fuel Type</FormLabel>
                              <RadioGroup defaultValue="electric" {...field}>
                                <Stack direction={["column", "row"]} spacing="24px">
                                  <Radio {...field} name="fuelType" value="gasoline">
                                    Gasoline
                                  </Radio>
                                  <Radio {...field} name="fuelType" value="electric">
                                    Electric
                                  </Radio>
                                  <Radio {...field} name="fuelType" value="cng">
                                    CNG
                                  </Radio>
                                  <Radio {...field} name="fuelType" value="hydrogen">
                                    Hydrogen
                                  </Radio>
                                  <Radio {...field} name="fuelType" value="hybrid">
                                    Hybrid
                                  </Radio>
                                </Stack>
                              </RadioGroup>
                              <FormHelperText>
                                This will help customer to choose the right car
                              </FormHelperText>
                            </FormControl>
                          )}
                        />
                      </Box>
                      <Box mt={4}>
                        <FormControl as="fieldset" isRequired={true}>
                          <FormLabel as="legend">Destination</FormLabel>
                          <Field as="select" name="destination">
                            {data
                              ? data.browseByDestination.map((destination) => (
                                  <option value={destination.id}>
                                    {destination.destinationName}
                                  </option>
                                ))
                              : ""}
                          </Field>
                          <FormHelperText>
                            Where do you plan to host this car, ideally where you reside
                          </FormHelperText>
                        </FormControl>
                      </Box>
                      <Box mt={4}>
                        <Text fontWeight={600}>Image upload</Text>
                        <Upload setImageResponse={setImageURL} />
                      </Box>
                      <Button
                        mt="4"
                        colorScheme="red"
                        isLoading={isSubmitting}
                        type="submit"
                        //isDisabled={imageURL.length < 3}
                      >
                        Host
                      </Button>
                    </Box>
                  </Box>
                </Form>
              )}
            </Formik>
          </Wrapper>
        </Layout>
      </Box>
    </>
  );
};

export default withApolloClient({})(HostCar);
