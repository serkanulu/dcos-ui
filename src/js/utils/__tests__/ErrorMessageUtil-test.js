const ErrorMessageUtil = require("../ErrorMessageUtil");

describe("ErrorMessageUtil", function() {
  describe("#translateErrorMessages", function() {
    it("passes through if there is no translation", function() {
      const errorInput = [
        {
          message: "message1",
          type: "TYPE1",
          path: [],
          variables: {}
        }
      ];
      const translationRules = [];

      expect(
        ErrorMessageUtil.translateErrorMessages(errorInput, translationRules)
      ).toEqual([
        {
          message: "message1",
          type: "TYPE1",
          path: [],
          variables: {}
        }
      ]);
    });

    it("passes through if no path matches", function() {
      const errorInput = [
        {
          message: "message1",
          type: "TYPE1",
          path: [],
          variables: {}
        }
      ];
      const translationRules = [
        {
          type: "TYPE1",
          path: /^E/,
          message: "message2"
        }
      ];

      expect(
        ErrorMessageUtil.translateErrorMessages(errorInput, translationRules)
      ).toEqual([
        {
          message: "message1",
          type: "TYPE1",
          path: [],
          variables: {}
        }
      ]);
    });

    it("passes through if no type matches", function() {
      const errorInput = [
        {
          message: "message1",
          type: "TYPE1",
          path: [],
          variables: {}
        }
      ];
      const translationRules = [
        {
          type: "TYPE2",
          path: /.*/,
          message: "message2"
        }
      ];

      expect(
        ErrorMessageUtil.translateErrorMessages(errorInput, translationRules)
      ).toEqual([
        {
          message: "message1",
          type: "TYPE1",
          path: [],
          variables: {}
        }
      ]);
    });

    it("translates if path and type matches", function() {
      const errorInput = [
        {
          message: "message1",
          type: "TYPE1",
          path: [],
          variables: {}
        }
      ];
      const translationRules = [
        {
          type: "TYPE1",
          path: /.*/,
          message: "message2"
        }
      ];

      expect(
        ErrorMessageUtil.translateErrorMessages(errorInput, translationRules)
      ).toEqual([
        {
          message: "message2",
          type: "TYPE1",
          path: [],
          variables: {}
        }
      ]);
    });

    it("does not modify path if a rule matches", function() {
      const errorInput = [
        {
          message: "message1",
          type: "TYPE1",
          path: ["foo", 0, "bar"],
          variables: {}
        }
      ];
      const translationRules = [
        {
          type: "TYPE1",
          path: /.*/,
          message: "message2"
        }
      ];

      expect(
        ErrorMessageUtil.translateErrorMessages(errorInput, translationRules)
      ).toEqual([
        {
          message: "message2",
          type: "TYPE1",
          path: ["foo", 0, "bar"],
          variables: {}
        }
      ]);
    });

    it("picks the first translation that passes", function() {
      const errorInput = [
        {
          message: "message1",
          type: "TYPE1",
          path: [],
          variables: {}
        }
      ];
      const translationRules = [
        {
          type: "TYPE1",
          path: /.*/,
          message: "message3"
        },
        {
          type: "TYPE1",
          path: /.*/,
          message: "message2"
        }
      ];

      expect(
        ErrorMessageUtil.translateErrorMessages(errorInput, translationRules)
      ).toEqual([
        {
          message: "message3",
          type: "TYPE1",
          path: [],
          variables: {}
        }
      ]);
    });

    it("replaces variables", function() {
      const errorInput = [
        {
          message: "message1 is 3",
          type: "TYPE1",
          path: [],
          variables: {
            value: 3
          }
        }
      ];
      const translationRules = [
        {
          type: "TYPE1",
          path: /.*/,
          message: "message2 is ||value||"
        }
      ];

      expect(
        ErrorMessageUtil.translateErrorMessages(errorInput, translationRules)
      ).toEqual([
        {
          message: "message2 is 3",
          type: "TYPE1",
          path: [],
          variables: {
            value: 3
          }
        }
      ]);
    });

    it("is able to handle errors with no path", function() {
      const errorInput = [{ message: "message" }];
      const translationRules = [];

      const translatedErrors = ErrorMessageUtil.translateErrorMessages(
        errorInput,
        translationRules
      );
      expect(translatedErrors).toEqual([{ message: "message" }]);
    });

    it("is able to handle errors with null messages", function() {
      const errorInput = [{ message: null }];
      const translationRules = [];

      const translatedErrors = ErrorMessageUtil.translateErrorMessages(
        errorInput,
        translationRules
      );
      expect(translatedErrors).toEqual([{ message: null }]);
    });
  });
});
