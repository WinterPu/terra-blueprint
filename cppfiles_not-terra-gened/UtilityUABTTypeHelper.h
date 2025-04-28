// Copyright(c) 2024 Agora.io. All rights reserved.

#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "Components/Image.h"


#include "UtilityAgoraBPuLogger.h"
#include "AgoraHeaderBase.h"
#include <string>


#include "AgoraBPuDataTypesBase.h"


#include "UtilityUABTTypeHelper.generated.h"




// Currently, We use UEnum for optional bool value display.
// For other (non-bool) optional variables, _SetValue is added to represent the Optional Null case.

#ifndef UABT_FUNCTION_MACRO

#if defined(_MSC_VER)
//#define UABT_FUNCTION_MACRO __FUNCSIG__ 
#define UABT_FUNCTION_MACRO __FUNCTION__
#else
#define UABT_FUNCTION_MACRO __PRETTY_FUNCTION__
#endif

#endif

#define AGUE_OPT_SUFFIX _SetValue

#define UABT_CONCAT_(a, b) a##b
#define UABT_CONCAT(a, b) UABT_CONCAT_(a, b)


#define UABT_SET_TARRAY_DATA(DST_UEBP, SRC_RAW, SIZE) \
	DST_UEBP.Empty(); \
	for (int i = 0; i < SIZE; i++) { \
		DST_UEBP.Add(SRC_RAW[i]); \
	}\
}

#define UABT_NEW_RAW_DATA_ARRAY(RAW_TYPE, DST_RAW, SRC_UEBP) \
	int Num = SRC_UEBP.Num(); \
	RAW_TYPE* DstArray = new RAW_TYPE[Num]; \
	for (int i = 0; i < Num; i++) { \
		DST_RAW[i] = SRC_UEBP[i].CreateRawData(); \
	}\
}

#define UABT_FREE_RAW_DATA_ARRAY(UABT_TYPE, PTR, SIZE) \
	if (Ptr){ \
		for (int i = 0; i < SIZE; i++) { \
			UABT_TYPE ReleaseOperator; \
			ReleaseOperator.FreeRawData(Ptr[i]); \
		}\
		delete[] Ptr; \
		Ptr = nullptr; \
	}\
}

UENUM(BlueprintType)
enum class EAgoraOptional : uint8 {
	AGORA_NULL_VALUE = 0,
	AGORA_TRUE_VALUE = 1,
	AGORA_FALSE_VALUE = 2,
};



// naming rules:
// 1. RAW_DATA - BP_DATA
// 2. Custom: means it would call CreateRawData() / FreeRawData() to create / release the raw data.
// 3. DataPtr1D: means it would handle 1d pointer data.
// 4. DataPtr2D: means it would handle 2d pointer data.
// 5. DataArray: means it would set the data to array.

namespace agora {
	namespace rtc {
		namespace ue {
			// Unreal Agora Blueprint Type Helper
			class UABT {

			public:



#pragma region To

				// the reason for not using Polymorphism is that: 
				// sometimes: the same source type would be converted to different types.
				// Ex. 
				// 1. uid_t ToRawType(int64);   
				// 2. uint32_t ToRawType(int64);

				// UE Blueprint Type To Agora Blueprint Type
				static inline agora::rtc::uid_t ToUID(int64 num) {
					if (num < 0 || num > static_cast<int64>(std::numeric_limits<agora::rtc::uid_t>::max())) {
						FString Msg = FString::Printf(TEXT("%lld is over the range of uid_t"), num);
						UAgoraBPuLogger::PrintWarn(Msg);
					}

					return static_cast<agora::rtc::uid_t>(num);
				}

				static inline uint32_t ToUInt32(int64 num) {
					if (num < 0 || num > static_cast<int64>(std::numeric_limits<uint32_t>::max())) {
						FString Msg = FString::Printf(TEXT("%lld is over the range of uid_t"), num);
						UAgoraBPuLogger::PrintWarn(Msg);
					}

					return static_cast<uint32_t>(num);
				}

				static inline agora::rtc::track_id_t ToVTID(int64 ID) {
					if (ID < 0 || ID > static_cast<int64>(std::numeric_limits<uint32>::max())) {
						FString Msg = FString::Printf(TEXT("%lld is over the range of track_id_t"), ID);
						UAgoraBPuLogger::PrintWarn(Msg);
					}

					return static_cast<agora::rtc::track_id_t>(ID);
				}

				// Convert: From FString to double
				static inline double ToDouble(const FString& str) {
					return FCString::Atod(*str);
				}


				static inline double ToDisplayID(int64 ID) {
					if (ID < 0 || ID > static_cast<int64>(std::numeric_limits<uint32>::max())) {
						FString Msg = FString::Printf(TEXT("%lld is over the range of track_id_t"), ID);
						UAgoraBPuLogger::PrintWarn(Msg);
					}

					return static_cast<agora::rtc::track_id_t>(ID);
				}


				static inline agora::view_t ToView(int64 view) {
					// For now, Windows doesn't support 32 bit
					return reinterpret_cast<view_t>(view);
				}



				static inline uint64_t ToUInt64FromFString(const FString & Src) {
					// need to be checked
					return 0;
				}

#pragma endregion To




#pragma region From
				// From Agora Type to UE Blueprint Type

				static inline int64 FromUID(agora::rtc::uid_t uid) {
					return (int64)uid;
				}

				static inline int64 FromVTID(agora::rtc::track_id_t ID) {
					return (int64)ID;
				}

				static inline int64 FromView(agora::view_t view) {
					return reinterpret_cast<int64>(view);
				}

				// Convert: From double to FString (The precision is 6 decimal places.)
				static inline FString FromDouble(double num){
					return FString::SanitizeFloat(num);
				}


				static inline FVector FromFloatArray(const float* farray) {
					if(farray == nullptr){
						return FVector::ZeroVector;
					}
					return FVector(farray[0], farray[1], farray[2]);
				}

				static inline FString FromUInt64ToFString(uint64_t num) {
					// TBD(WinterPu)
					// need to be checked
					return FString::FromInt(num);
				}

#pragma endregion From


#pragma region New

				static inline char* New_CharPtr1D(const FString& Str) {
					FTCHARToUTF8 TempUTF8String(*(Str));
					char* TempCharPtr = new char[TempUTF8String.Length() + 1];
					FMemory::Memcpy(TempCharPtr, TempUTF8String.Get(), TempUTF8String.Length());
					TempCharPtr[TempUTF8String.Length()] = '\0';
					return TempCharPtr;
				}

				static inline unsigned char* New_UnsignedCharPtr1D(const FString& Str) {
					FTCHARToUTF8 TempUTF8String(*(Str));
					unsigned char* TempCharPtr = new unsigned char[TempUTF8String.Length() + 1];
					FMemory::Memcpy(TempCharPtr, TempUTF8String.Get(), TempUTF8String.Length());
					TempCharPtr[TempUTF8String.Length()] = '\0';
					return TempCharPtr;
				}


				static inline char** New_CharPtr2D(const TArray<FString> & StrList, int Size){
				
					char** Result = new char* [Size]; 
					for (unsigned int i = 0; i < static_cast<unsigned int>(Size); i++) {
						Result[i] = UABT::New_CharPtr1D(StrList[i]);
					}
					return Result;

				}


				static inline void New_CharArray2D(const char**  Dst, const TArray<FString>& StrList, int Size){
					// because cannot assign char** to const  char **
				}

				template<typename RAW_TYPE, typename UABT_TYPE>
				static inline RAW_TYPE* New_RawDataPtr1D(const TArray<UABT_TYPE>& SrcArray, int SizeCount) {
					RAW_TYPE* Result = new RAW_TYPE[SizeCount];
					for (int i = 0; i < SizeCount; i++) {
						Result[i] = static_cast<RAW_TYPE>(SrcArray[i]);
					}
					return Result;
				}


				template<typename RAW_TYPE, typename UABT_TYPE>
				static inline RAW_TYPE* New_CustomRawDataPtr1D(const TArray<UABT_TYPE>& SrcArray, int SizeCount) {
					RAW_TYPE* Result = new RAW_TYPE[SizeCount];
					//for (int i = 0; i < SizeCount; i++) {
					//	// Create a temporary variable to hold the raw data
					//	RAW_TYPE RawData = SrcArray[i].CreateRawData();
					//	// Because some copy constructors may allocate a new memory block, we need to use FMemory::Memcpy to copy directly to ensure that all memory is allocated by us.
					//	FMemory::Memcpy(&Result[i], &(RawData), sizeof(RAW_TYPE));
					//}

					return Result;
				}

				template<typename RAW_TYPE, typename UABT_TYPE>
				static inline void New_CustomRawDataArray(const RAW_TYPE* DstArray , const TArray<UABT_TYPE>& SrcArray, int SizeCount) {
					//for (int i = 0; i < SizeCount; i++) {
					//	// Create a temporary variable to hold the raw data
					//	RAW_TYPE RawData = SrcArray[i].CreateRawData();
					//	// Because some copy constructors may allocate a new memory block, we need to use FMemory::Memcpy to copy directly to ensure that all memory is allocated by us.
					//	FMemory::Memcpy(&DstArray[i], &(RawData), sizeof(RAW_TYPE));
					//}
				}


				template<typename RAW_TYPE, typename UABT_TYPE>
				static inline void New_RawDataArray(const RAW_TYPE* DstArray, const TArray<UABT_TYPE>& SrcArray, int SizeCount) {
					//for (int i = 0; i < SizeCount; i++) {
					//	// Create a temporary variable to hold the raw data
					//	RAW_TYPE RawData = SrcArray[i].CreateRawData();
					//	// Because some copy constructors may allocate a new memory block, we need to use FMemory::Memcpy to copy directly to ensure that all memory is allocated by us.
					//	FMemory::Memcpy(&DstArray[i], &(RawData), sizeof(RAW_TYPE));
					//}
				}


				template<typename RAW_TYPE, typename UABT_TYPE>
				static inline void New_CustomRawDataArrayForUCLASS(const RAW_TYPE* DstArray, const TArray<UABT_TYPE*>& SrcArray, int SizeCount) {
					//for (int i = 0; i < SizeCount; i++) {
					//	// Create a temporary variable to hold the raw data
					//	RAW_TYPE RawData = SrcArray[i].CreateRawData();
					//	// Because some copy constructors may allocate a new memory block, we need to use FMemory::Memcpy to copy directly to ensure that all memory is allocated by us.
					//	FMemory::Memcpy(&DstArray[i], &(RawData), sizeof(RAW_TYPE));
					//}
				}


#pragma endregion New


#pragma region Free
				
				
				template<typename T>
				static inline void Free_Ptr1D(T* & Ptr){
					if (Ptr) {
						delete[] Ptr;
						Ptr = nullptr;
					}
				}

				
				template<typename T>
				static inline void Free_Ptr2D(T**& Ptr,unsigned int Size) {
					if (Ptr) {
						for (unsigned int i = 0; i < Size; i++) {
							Free_Ptr1D<T>(Ptr[i]);
						}
						delete[] Ptr;
						Ptr = nullptr;
					}
				}



				static inline void Free_CharPtr1D(const char* & Ptr){
					Free_Ptr1D<const char>(Ptr);
				}

				static inline void Free_UnsignedCharPtr1D(const unsigned char* Ptr) {
					Free_Ptr1D<const unsigned char>(Ptr);
				}

				static inline void Free_CharPtr2D(const char** & ptr,int size){
					if (ptr) {
						for (unsigned int i = 0; i < static_cast<unsigned int>(size); i++) {
							Free_CharPtr1D(ptr[i]);
						}
						delete[] ptr;
						ptr = nullptr;
					}

				}


				static inline void Free_CharArray2D(const char** Dst, int Size) {
				
				}

				static inline void Free_UIDPtr1D(agora::rtc::uid_t*& Ptr) {
					Free_Ptr1D<agora::rtc::uid_t>(Ptr);
				}

				template<typename RAW_TYPE>
				static inline void Free_RawDataPtr1D(RAW_TYPE*& Ptr) {
					Free_Ptr1D<RAW_TYPE>(Ptr);
				}

				template<typename RAW_TYPE, typename UABT_TYPE>
				static inline void Free_CustomRawDataPtr1D(RAW_TYPE * & Ptr,int Count) {
	/*			if(Ptr){
						for (int i = 0; i < Count; i++) {
							UABT_TYPE ReleaseOperator;
							ReleaseOperator.FreeRawData(Ptr[i]);
						}
						delete[] Ptr;
						Ptr = nullptr;
					}*/
				}

				template<typename RAW_TYPE, typename UABT_TYPE>
				static inline void Free_CustomRawDataArray(const RAW_TYPE* Ptr,int Count) {
					//if(Ptr){
					//	for (int i = 0; i < Count; i++) {
					//		UABT_TYPE ReleaseOperator;
					//		ReleaseOperator.FreeRawData(Ptr[i]);
					//	}
					//	//delete[] Ptr;
					//	//Ptr = nullptr;
					//}
				}

				template<typename RAW_TYPE, typename UABT_TYPE>
				static inline void Free_RawDataArray(const RAW_TYPE* Ptr, int Count) {
					//if(Ptr){
					//	for (int i = 0; i < Count; i++) {
					//		UABT_TYPE ReleaseOperator;
					//		ReleaseOperator.FreeRawData(Ptr[i]);
					//	}
					//	//delete[] Ptr;
					//	//Ptr = nullptr;
					//}
				}


				template<typename RAW_TYPE, typename UABT_TYPE>
				static inline void Free_CustomRawDataArrayForUCLASS(const RAW_TYPE* Ptr, int Count) {
					//if(Ptr){
					//	for (int i = 0; i < Count; i++) {
					//		UABT_TYPE ReleaseOperator;
					//		ReleaseOperator.FreeRawData(Ptr[i]);
					//	}
					//	//delete[] Ptr;
					//	//Ptr = nullptr;
					//}
				}

#pragma endregion Free



#pragma region Set

				

				static inline void SetFloatArray (float farray[3], const FVector & vec)
				{
					farray[0] = vec.X;
					farray[1] = vec.Y;
					farray[2] = vec.Z;
				}


				static inline void SetCharArray(char* Dst, FString Src, int MaxSize){
				
					std::string cstr = TCHAR_TO_UTF8(*(Src));
					if (cstr.length() + 1 <= (MaxSize)) {
						for (int i = 0; i < cstr.length(); i++) {
							(Dst)[i] = cstr[i];
						}
							(Dst)[cstr.length()] = '\0';
						}
					else {
						UE_LOG(LogTemp, Warning, TEXT("[Agora UABT] FString to CharArray Failed: Reason:[Size %d >= %d, leaving no space for the end-of-line symbol. Location: [%s] ]"),cstr.length(),(MaxSize),*FString(UABT_FUNCTION_MACRO));
					}
				}

				static inline void SetBPFStringTArray(TArray<FString>& Dst, const char** Src, int Size){
					Dst.Empty();
					for (int i = 0; i < Size; i++) {
						if (Src[i] != nullptr) {
							Dst.Add(FString(UTF8_TO_TCHAR(Src[i])));
						}
						else {
							Dst.Add(FString()); // Add empty string for null pointers
						}
					}
				}


				template<typename RAW_TYPE, typename UABT_TYPE>
				static inline void SetBPDataArray(TArray<UABT_TYPE>& Dst, const RAW_TYPE* Src, int Size){
					//Dst.Empty();
					//for (int i = 0; i < Size; i++) {
					//	Dst.Add(Src[i]);
					//}
				}


				template<typename RAW_TYPE, typename UABT_TYPE>
				static inline void SetBPDataArrayForUCLASS(TArray<UABT_TYPE*>& Dst, const RAW_TYPE* Src, int Size) {
					//Dst.Empty();
					//for (int i = 0; i < Size; i++) {
					//	Dst.Add(Src[i]);
					//}
				}

				template<typename RAW_TYPE, typename UABT_TYPE>
				static inline void SetRawDataArray(const RAW_TYPE* Dst, TArray<UABT_TYPE>& Src,int Size){
					for (int i = 0; i < Size; i++) {
						Dst[i] = static_cast<RAW_TYPE>(Src[i]);
					}
				}


#pragma endregion Set

			};
		}
	}
}



#pragma region Set UEBP Optional Value


// [SetUEBPOptional] - Bool
#define SET_UEBP_OPTIONAL_VAL_BOOL(DST_UEBP_VAR,SRC_AGORA_VAR)\
	if((SRC_AGORA_VAR).has_value()){\
		(DST_UEBP_VAR) = (SRC_AGORA_VAR).value() ? EAgoraOptional::AGORA_TRUE_VALUE : EAgoraOptional::AGORA_FALSE_VALUE;\
	}else{\
		(DST_UEBP_VAR) = EAgoraOptional::AGORA_NULL_VALUE;\
	}


// directly assign value to the variable
// [SetUEBPOptional] - Directly Assign With Value [OPT_VAL]
#define SET_UEBP_OPTIONAL_VAL_ASSIGN_VAL(DST_UEBP_VAR,SRC_AGORA_VAR,OPT_VAL)\
	if((SRC_AGORA_VAR).has_value()){\
		(DST_UEBP_VAR) = OPT_VAL;\
		UABT_CONCAT(DST_UEBP_VAR,AGUE_OPT_SUFFIX)=  true;\
	}else{\
		UABT_CONCAT(DST_UEBP_VAR,AGUE_OPT_SUFFIX) = false;\
	}

#pragma endregion


#pragma region Set Agora Optional Value

// [SetAgoraOptional] - Optional<Bool>
#define SET_AGORA_OPTIONAL_VAL_BOOL(DST_AGORA_VAR,SRC_UEBP_VAR)\
	if((SRC_UEBP_VAR) == EAgoraOptional::AGORA_TRUE_VALUE){\
		(DST_AGORA_VAR) = true;\
	}else if((SRC_UEBP_VAR) == EAgoraOptional::AGORA_FALSE_VALUE){\
		(DST_AGORA_VAR) = false;\
	}else{\
		(DST_AGORA_VAR) = agora::nullopt;\
	}


//[SetAgoraOptional] - Directly Assign with Specified Value
#define SET_AGORA_OPTIONAL_VAL_ASSIGN_VAL(DST_AGORA_VAR,SRC_UEBP_VAR,OPT_VAL)\
	if(UABT_CONCAT(SRC_UEBP_VAR,AGUE_OPT_SUFFIX)== true){\
		(DST_AGORA_VAR) = OPT_VAL;\
	}

#pragma endregion







#pragma region Custom Defined

UENUM()
enum class EAgoraBPuEventHandlerType : uint8
{
	None = 0 UMETA(Hidden, DisplayName = "AGORA NULL VALUE"),
	EventHandler = 1,
	EventHandlerEx = 2
};

#pragma endregion Custom Defined



#pragma region Optional Value
USTRUCT(BlueprintType)
struct FUABT_Opt_bool {

	GENERATED_BODY()

public:
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "Agora|Opt_bool")
	EAgoraOptional Value = EAgoraOptional::AGORA_NULL_VALUE;

	FUABT_Opt_bool() {}
	FUABT_Opt_bool(const agora::Optional<bool> AgoraOptVal) {
		if (AgoraOptVal.has_value() == true) {
			Value = AgoraOptVal.value()? EAgoraOptional::AGORA_TRUE_VALUE : EAgoraOptional::AGORA_FALSE_VALUE;
		}
		else {
			Value = EAgoraOptional::AGORA_NULL_VALUE;
		}
	}

	agora::Optional<bool> CreateRawOptData() const {
		if (Value == EAgoraOptional::AGORA_TRUE_VALUE) {
			return true;
		}
		else if (Value == EAgoraOptional::AGORA_FALSE_VALUE) {
			return false;
		}
		return agora::nullopt;
	}

	static void FreeRawOptData(agora::Optional<bool>& AgoraData) {

	}
};


USTRUCT(BlueprintType)
struct FUABT_Opt_VIDEO_STREAM_TYPE {
	
	GENERATED_BODY()

public:
	// If the box is unchecked, the value of the corresponding variable will be ignored.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "Agora|Opt_VIDEO_STREAM_TYPE")

	bool SetValue = false;

	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "Agora|Opt_VIDEO_STREAM_TYPE")
	EUABT_VIDEO_STREAM_TYPE Value = EUABT_VIDEO_STREAM_TYPE::VIDEO_STREAM_HIGH;

	FUABT_Opt_VIDEO_STREAM_TYPE() {}
	FUABT_Opt_VIDEO_STREAM_TYPE(const agora::Optional<agora::rtc::VIDEO_STREAM_TYPE> AgoraOptVal) {
		SetValue = AgoraOptVal.has_value();
		if (SetValue == true) {
			Value = agora::rtc::ue::UABTEnum::WrapWithUE(AgoraOptVal.value());
		}
	}


	agora::Optional<agora::rtc::VIDEO_STREAM_TYPE> CreateRawOptData() const {
		if (SetValue == true) {
			return agora::rtc::ue::UABTEnum::ToRawValue(Value);
		}
		return agora::Optional<agora::rtc::VIDEO_STREAM_TYPE>();
	}

	static void FreeRawOptData(agora::Optional<agora::rtc::VIDEO_STREAM_TYPE>& AgoraData) {
	}
};


USTRUCT(BlueprintType)
struct FUABT_Opt_CAMERA_DIRECTION {
	
	GENERATED_BODY()

public:
	// If the box is unchecked, the value of the corresponding variable will be ignored.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "Agora|Opt_CAMERA_DIRECTION")

	bool SetValue = false;

	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "Agora|Opt_CAMERA_DIRECTION")
	EUABT_CAMERA_DIRECTION Value = EUABT_CAMERA_DIRECTION::CAMERA_FRONT;

	FUABT_Opt_CAMERA_DIRECTION() {}
	FUABT_Opt_CAMERA_DIRECTION(const agora::Optional<agora::rtc::CAMERA_DIRECTION> AgoraOptVal) {
		SetValue = AgoraOptVal.has_value();
		if (SetValue == true) {
			Value = agora::rtc::ue::UABTEnum::WrapWithUE(AgoraOptVal.value());
		}
	}

	agora::Optional<agora::rtc::CAMERA_DIRECTION> CreateRawOptData() const {
		if (SetValue == true) {
			return agora::rtc::ue::UABTEnum::ToRawValue(Value);
		}
		return agora::Optional<agora::rtc::CAMERA_DIRECTION>();
	}

	static void FreeRawOptData(agora::Optional<agora::rtc::CAMERA_DIRECTION>& AgoraData) {
	}
};



USTRUCT(BlueprintType)
struct FUABT_Opt_CAMERA_FOCAL_LENGTH_TYPE {
	
	GENERATED_BODY()

public:
	// If the box is unchecked, the value of the corresponding variable will be ignored.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "Agora|Opt_CAMERA_FOCAL_LENGTH_TYPE")

	bool SetValue = false;

	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "Agora|Opt_CAMERA_FOCAL_LENGTH_TYPE")
	EUABT_CAMERA_FOCAL_LENGTH_TYPE Value = EUABT_CAMERA_FOCAL_LENGTH_TYPE::CAMERA_FOCAL_LENGTH_DEFAULT;

	FUABT_Opt_CAMERA_FOCAL_LENGTH_TYPE() {}
	FUABT_Opt_CAMERA_FOCAL_LENGTH_TYPE(const agora::Optional<agora::rtc::CAMERA_FOCAL_LENGTH_TYPE> AgoraOptVal) {
		SetValue = AgoraOptVal.has_value();
		if (SetValue == true) {
			Value = agora::rtc::ue::UABTEnum::WrapWithUE(AgoraOptVal.value());
		}
	}

	agora::Optional<agora::rtc::CAMERA_FOCAL_LENGTH_TYPE> CreateRawOptData() const {
		if (SetValue == true) {
			return agora::rtc::ue::UABTEnum::ToRawValue(Value);
		}
		return agora::Optional<agora::rtc::CAMERA_FOCAL_LENGTH_TYPE>();
	}

	static void FreeRawOptData(agora::Optional<agora::rtc::CAMERA_FOCAL_LENGTH_TYPE>& AgoraData) {
	}

};

USTRUCT(BlueprintType)
struct FUABT_Opt_double {
	
	GENERATED_BODY()

public:
	// If the box is unchecked, the value of the corresponding variable will be ignored.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "Agora|Opt_double")

	bool SetValue = false;

	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "Agora|Opt_double")
	FString Value = "";

	FUABT_Opt_double() {}
	FUABT_Opt_double(const agora::Optional<double> AgoraOptVal) {
		SetValue = AgoraOptVal.has_value();
		if (SetValue == true) {
			Value = agora::rtc::ue::UABT::FromDouble(AgoraOptVal.value());
		}
		else {
			Value = AGORA_UEBP_ERR_STR[AGORA_UE_ERROR_CODE::ERROR_OPTIONAL_VALUE_NOT_SET];
		}
	}

	agora::Optional<double> CreateRawOptData() const {
		if (SetValue == true) {
			return agora::rtc::ue::UABT::ToDouble(Value);
		}
		return agora::Optional<double>();
	}

	static void FreeRawOptData(agora::Optional<double>& AgoraData) {
	}
};



USTRUCT(BlueprintType)
struct FUABT_Opt_int {
	
	GENERATED_BODY()

public:
	// If the box is unchecked, the value of the corresponding variable will be ignored.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "Agora|Opt_int")

	bool SetValue = false;

	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "Agora|Opt_int")
	int Value = 0;

	FUABT_Opt_int() {}
	FUABT_Opt_int(const agora::Optional<int> AgoraOptVal) {
		SetValue = AgoraOptVal.has_value();
		if (SetValue == true) {
			Value = AgoraOptVal.value();
		}
		else {
			Value = 0;
		}
	}

	agora::Optional<int> CreateRawOptData() const {
		if (SetValue == true) {
			return Value;
		}
		return agora::Optional<int>();
	}

	static void FreeRawOptData(agora::Optional<int>& AgoraData) {
	}
};



USTRUCT(BlueprintType)
struct FUABT_Opt_ConstCharPtr {
	
	GENERATED_BODY()

public:
	// If the box is unchecked, the value of the corresponding variable will be ignored.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "Agora|Opt_ConstCharPtr")

	bool SetValue = false;

	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "Agora|Opt_ConstCharPtr")
	FString Value = "";

	FUABT_Opt_ConstCharPtr() {}
	FUABT_Opt_ConstCharPtr(const agora::Optional<const char*> AgoraOptVal) {
		SetValue = AgoraOptVal.has_value();
		if (SetValue == true) {
			Value = UTF8_TO_TCHAR(AgoraOptVal.value());
		}
		else{
			Value = AGORA_UEBP_ERR_STR[AGORA_UE_ERROR_CODE::ERROR_OPTIONAL_VALUE_NOT_SET];
		}
	}
	agora::Optional<const char*> CreateRawOptData() const {
		if (SetValue == true) {
			return agora::rtc::ue::UABT::New_CharPtr1D(Value);
		}
		return agora::Optional<const char*>();
	}

	static void FreeRawOptData(agora::Optional<const char*> & AgoraData) {
		if (AgoraData.has_value() == true) {
			const char* Ptr = AgoraData.value();
			agora::rtc::ue::UABT::Free_CharPtr1D(Ptr);
			AgoraData = nullptr;
		}
	}
};



USTRUCT(BlueprintType)
struct FUABT_Opt_CLIENT_ROLE_TYPE {
	
	GENERATED_BODY()

public:
	// If the box is unchecked, the value of the corresponding variable will be ignored.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "Agora|Opt_CLIENT_ROLE_TYPE")

	bool SetValue = false;

	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "Agora|Opt_CLIENT_ROLE_TYPE")
	EUABT_CLIENT_ROLE_TYPE Value = EUABT_CLIENT_ROLE_TYPE::CLIENT_ROLE_AUDIENCE;

	FUABT_Opt_CLIENT_ROLE_TYPE() {}
	FUABT_Opt_CLIENT_ROLE_TYPE(const agora::Optional<agora::rtc::CLIENT_ROLE_TYPE> AgoraOptVal) {
		SetValue = AgoraOptVal.has_value();
		if (SetValue == true) {
			Value = agora::rtc::ue::UABTEnum::WrapWithUE(AgoraOptVal.value());
		}
	}

	agora::Optional<agora::rtc::CLIENT_ROLE_TYPE> CreateRawOptData() const {
		if (SetValue == true) {
			return agora::rtc::ue::UABTEnum::ToRawValue(Value);
		}
		return agora::Optional<agora::rtc::CLIENT_ROLE_TYPE>();
	}

	static void FreeRawOptData(agora::Optional<agora::rtc::CLIENT_ROLE_TYPE>& AgoraData) {
	}
};




USTRUCT(BlueprintType)
struct FUABT_Opt_AUDIENCE_LATENCY_LEVEL_TYPE {
	
	GENERATED_BODY()

public:
	// If the box is unchecked, the value of the corresponding variable will be ignored.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "Agora|Opt_AUDIENCE_LATENCY_LEVEL_TYPE")

	bool SetValue = false;

	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "Agora|Opt_AUDIENCE_LATENCY_LEVEL_TYPE")
	EUABT_AUDIENCE_LATENCY_LEVEL_TYPE Value = EUABT_AUDIENCE_LATENCY_LEVEL_TYPE::AUDIENCE_LATENCY_LEVEL_LOW_LATENCY;

	FUABT_Opt_AUDIENCE_LATENCY_LEVEL_TYPE() {}
	FUABT_Opt_AUDIENCE_LATENCY_LEVEL_TYPE(const agora::Optional<agora::rtc::AUDIENCE_LATENCY_LEVEL_TYPE> AgoraOptVal) {
		SetValue = AgoraOptVal.has_value();
		if (SetValue == true) {
			Value = agora::rtc::ue::UABTEnum::WrapWithUE(AgoraOptVal.value());
		}
	}

	agora::Optional<agora::rtc::AUDIENCE_LATENCY_LEVEL_TYPE> CreateRawOptData() const {
		if (SetValue == true) {
			return agora::rtc::ue::UABTEnum::ToRawValue(Value);
		}
		return agora::Optional<agora::rtc::AUDIENCE_LATENCY_LEVEL_TYPE>();
	}


	static void FreeRawOptData(agora::Optional<agora::rtc::AUDIENCE_LATENCY_LEVEL_TYPE>& AgoraData) {
	}
};



USTRUCT(BlueprintType)
struct FUABT_Opt_CHANNEL_PROFILE_TYPE {
	
	GENERATED_BODY()

public:
	// If the box is unchecked, the value of the corresponding variable will be ignored.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "Agora|Opt_CHANNEL_PROFILE_TYPE")

	bool SetValue = false;

	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "Agora|Opt_CHANNEL_PROFILE_TYPE")
	EUABT_CHANNEL_PROFILE_TYPE Value = EUABT_CHANNEL_PROFILE_TYPE::CHANNEL_PROFILE_LIVE_BROADCASTING;

	FUABT_Opt_CHANNEL_PROFILE_TYPE() {}
	FUABT_Opt_CHANNEL_PROFILE_TYPE(const agora::Optional<agora::CHANNEL_PROFILE_TYPE> AgoraOptVal) {
		SetValue = AgoraOptVal.has_value();
		if (SetValue == true) {
			Value = agora::rtc::ue::UABTEnum::WrapWithUE(AgoraOptVal.value());
		}
	}

	agora::Optional<agora::CHANNEL_PROFILE_TYPE> CreateRawOptData() const {
		if (SetValue == true) {
			return agora::rtc::ue::UABTEnum::ToRawValue(Value);
		}
		return agora::Optional<agora::CHANNEL_PROFILE_TYPE>();
	}

	static void FreeRawOptData(agora::Optional<agora::CHANNEL_PROFILE_TYPE>& AgoraData) {
	}

};



USTRUCT(BlueprintType)
struct FUABT_Opt_video_track_id_t {
	
	GENERATED_BODY()

public:
	// If the box is unchecked, the value of the corresponding variable will be ignored.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "Agora|Opt_video_track_id_t")

	bool SetValue = false;

	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "Agora|Opt_video_track_id_t")
	int64 Value = 0;

	FUABT_Opt_video_track_id_t() {}
	FUABT_Opt_video_track_id_t(const agora::Optional<agora::rtc::video_track_id_t> AgoraOptVal) {
		SetValue = AgoraOptVal.has_value();
		if (SetValue == true) {
			Value = AgoraOptVal.value();
		}
	}

	agora::Optional<agora::rtc::video_track_id_t> CreateRawOptData() const {
		if (SetValue == true) {
			return agora::rtc::ue::UABT::ToVTID(Value);
		}
		return agora::Optional<agora::rtc::video_track_id_t>();
	}

	static void FreeRawOptData(agora::Optional<agora::rtc::video_track_id_t>& AgoraData) {

	}
};


USTRUCT(BlueprintType)
struct FUABT_Opt_THREAD_PRIORITY_TYPE {
	
	GENERATED_BODY()

public:

	// If the box is unchecked, the value of the corresponding variable will be ignored.
	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "Agora|Opt_THREAD_PRIORITY_TYPE")

	bool SetValue = false;

	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "Agora|Opt_THREAD_PRIORITY_TYPE")
	EUABT_THREAD_PRIORITY_TYPE Value = EUABT_THREAD_PRIORITY_TYPE::NORMAL;

	FUABT_Opt_THREAD_PRIORITY_TYPE(){}
	FUABT_Opt_THREAD_PRIORITY_TYPE(const agora::Optional<agora::rtc::THREAD_PRIORITY_TYPE> AgoraOptVal){
	
		SetValue = AgoraOptVal.has_value();

		Value= agora::rtc::ue::UABTEnum::WrapWithUE(AgoraOptVal.value());
	}
	agora::Optional<agora::rtc::THREAD_PRIORITY_TYPE> CreateRawOptData() const {
		if (SetValue == true){
			return agora::rtc::ue::UABTEnum::ToRawValue(Value);
		}
		return agora::Optional<agora::rtc::THREAD_PRIORITY_TYPE>();
	}

	static void FreeRawOptData(agora::Optional<agora::rtc::THREAD_PRIORITY_TYPE>& AgoraData) {
	}
};

#pragma endregion Optional Value


// Custom Header!

namespace agora {
	namespace rtc {

		// virtual const char* getVersion(int* build) = 0;
		struct SDKBuildInfo {
			int build;
			const char* version;
		};

		// IVideoDeviceCollection
		// virtual int getDevice(int index, char deviceName[MAX_DEVICE_ID_LENGTH],
		//                        char deviceId[MAX_DEVICE_ID_LENGTH]) = 0;
		struct VideoDeviceInfo {
			const char* deviceId;
			const char* deviceName;
		};


		// IAudioDeviceCollection
		// virtual int getDevice(int index, char deviceName[MAX_DEVICE_ID_LENGTH], char deviceTypeName[MAX_DEVICE_ID_LENGTH],
		//                       char deviceId[MAX_DEVICE_ID_LENGTH]) = 0;
		struct AudioDeviceInfo {
			const char* deviceId;
			const char* deviceTypeName;
			const char* deviceName;
		};


	}
}

